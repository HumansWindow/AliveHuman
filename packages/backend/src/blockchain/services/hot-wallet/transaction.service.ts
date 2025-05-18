import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

export interface TransactionRequest {
  to: string;
  from?: string;
  value?: string; // in wei
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  /**
   * Create a transaction object with optimal gas settings
   * @param txRequest Transaction request parameters
   * @param provider Ethereum provider
   * @returns Transaction request with gas settings
   */
  async createTransaction(
    txRequest: TransactionRequest,
    provider: ethers.providers.Provider,
  ): Promise<ethers.providers.TransactionRequest> {
    // Start with the basic transaction parameters
    const tx: ethers.providers.TransactionRequest = {
      to: txRequest.to,
      from: txRequest.from,
      data: txRequest.data || '0x',
    };

    // Set value if provided (convert from string to BigNumber)
    if (txRequest.value) {
      tx.value = ethers.utils.parseUnits(txRequest.value, 'wei');
    }

    // Set gas limit if provided or estimate it
    if (txRequest.gasLimit) {
      tx.gasLimit = ethers.utils.parseUnits(txRequest.gasLimit, 'wei');
    } else {
      try {
        // Estimate gas with a 20% buffer for safety
        const estimatedGas = await provider.estimateGas(tx);
        tx.gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer
      } catch (error) {
        this.logger.error(`Failed to estimate gas: ${error.message}`);
        // If estimation fails, use a default value
        tx.gasLimit = ethers.utils.parseUnits('500000', 'wei');
      }
    }

    // Set gas price if provided or get from network
    if (txRequest.gasPrice) {
      tx.gasPrice = ethers.utils.parseUnits(txRequest.gasPrice, 'wei');
    } else {
      try {
        // For EIP-1559 compatible networks (like Ethereum mainnet and Polygon)
        const feeData = await provider.getFeeData();
        
        // Use maxFeePerGas and maxPriorityFeePerGas if available (EIP-1559)
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          tx.maxFeePerGas = feeData.maxFeePerGas;
          tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
        } else {
          // Fallback to gasPrice for non-EIP-1559 networks
          tx.gasPrice = feeData.gasPrice;
        }
      } catch (error) {
        this.logger.error(`Failed to get fee data: ${error.message}`);
        // If fee data retrieval fails, get gas price directly
        try {
          const gasPrice = await provider.getGasPrice();
          tx.gasPrice = gasPrice.mul(120).div(100); // Add 20% buffer
        } catch (error) {
          this.logger.error(`Failed to get gas price: ${error.message}`);
          // If all fails, use a default value
          tx.gasPrice = ethers.utils.parseUnits('100', 'gwei');
        }
      }
    }

    return tx;
  }

  /**
   * Calculate the transaction cost in wei
   * @param tx Transaction request
   * @returns Cost in wei as a string
   */
  calculateTransactionCost(tx: ethers.providers.TransactionRequest): string {
    const gasLimit = tx.gasLimit as ethers.BigNumber;
    let gasCost: ethers.BigNumber;

    // Calculate gas cost based on the transaction type (EIP-1559 or legacy)
    if (tx.maxFeePerGas) {
      // EIP-1559 transaction
      const maxFeePerGas = tx.maxFeePerGas as ethers.BigNumber;
      gasCost = gasLimit.mul(maxFeePerGas);
    } else {
      // Legacy transaction
      const gasPrice = tx.gasPrice as ethers.BigNumber;
      gasCost = gasLimit.mul(gasPrice);
    }

    // Add the transaction value if it exists
    if (tx.value) {
      const value = tx.value as ethers.BigNumber;
      return value.add(gasCost).toString();
    }

    return gasCost.toString();
  }

  /**
   * Wait for a transaction to be confirmed
   * @param txHash Transaction hash
   * @param provider Ethereum provider
   * @param confirmations Number of confirmations to wait for
   * @returns Transaction receipt
   */
  async waitForTransaction(
    txHash: string,
    provider: ethers.providers.Provider,
    confirmations: number = 1,
  ): Promise<ethers.providers.TransactionReceipt> {
    try {
      this.logger.log(`Waiting for transaction ${txHash} to be confirmed...`);
      const receipt = await provider.waitForTransaction(txHash, confirmations);
      this.logger.log(`Transaction ${txHash} confirmed with ${receipt.confirmations} confirmations`);
      return receipt;
    } catch (error) {
      this.logger.error(`Error waiting for transaction ${txHash}: ${error.message}`);
      throw error;
    }
  }
}