import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { KeyManagementService } from './key-management.service';
import { TransactionService } from './transaction.service';
import { RpcProviderService } from '../rpc-provider.service';

@Injectable()
export class HotWalletService {
  private readonly logger = new Logger(HotWalletService.name);
  private readonly hotWalletAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly keyManagementService: KeyManagementService,
    private readonly transactionService: TransactionService,
    private readonly rpcProviderService: RpcProviderService,
  ) {
    this.hotWalletAddress = this.configService.get<string>('blockchain.hotWallet.address');
    if (!this.hotWalletAddress) {
      this.logger.warn('Hot wallet address not configured');
    }
  }

  /**
   * Get the hot wallet address
   * @returns The wallet address
   */
  async getWalletAddress(): Promise<string> {
    return this.hotWalletAddress;
  }

  /**
   * Get the hot wallet balance on the specified network
   * @param network Blockchain network to use
   * @returns Wallet balance in wei as string
   */
  async getWalletBalance(network: 'ethereum' | 'polygon' | 'mumbai' = 'polygon'): Promise<string> {
    if (!this.hotWalletAddress) {
      throw new Error('Hot wallet address not configured');
    }

    const provider = await this.rpcProviderService.getProvider(network);
    const balance = await provider.getBalance(this.hotWalletAddress);
    return balance.toString();
  }

  /**
   * Sign a message with the hot wallet private key
   * @param message Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    const wallet = await this.keyManagementService.getWallet();
    return wallet.signMessage(message);
  }

  /**
   * Send a transaction from the hot wallet
   * @param network Blockchain network to use
   * @param to Recipient address
   * @param value Amount in wei
   * @param data Transaction data
   * @returns Transaction hash
   */
  async sendTransaction(
    network: 'ethereum' | 'polygon' | 'mumbai',
    to: string,
    value: string,
    data: string = '0x',
  ): Promise<string> {
    const provider = await this.rpcProviderService.getProvider(network);
    const wallet = await this.keyManagementService.getWallet(provider);
    
    const tx = await this.transactionService.createTransaction({
      to,
      value,
      data,
      from: this.hotWalletAddress,
    }, provider);
    
    const signedTx = await wallet.sendTransaction(tx);
    this.logger.log(`Transaction sent: ${signedTx.hash}`);
    
    return signedTx.hash;
  }

  /**
   * Call a contract method with the hot wallet
   * @param network Blockchain network to use
   * @param contractAddress Contract address
   * @param abi Contract ABI
   * @param method Method name
   * @param params Method parameters
   * @returns Transaction hash
   */
  async callContract(
    network: 'ethereum' | 'polygon' | 'mumbai',
    contractAddress: string,
    abi: any[],
    method: string,
    params: any[] = [],
  ): Promise<string> {
    const provider = await this.rpcProviderService.getProvider(network);
    const wallet = await this.keyManagementService.getWallet(provider);
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    try {
      const tx = await contract[method](...params);
      const receipt = await tx.wait();
      this.logger.log(`Contract call successful: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Contract call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitor a transaction until it's confirmed
   * @param network Blockchain network
   * @param txHash Transaction hash
   * @param confirmations Number of confirmations to wait for
   * @returns True if transaction is successful
   */
  async monitorTransaction(
    network: 'ethereum' | 'polygon' | 'mumbai',
    txHash: string,
    confirmations: number = 1
  ): Promise<boolean> {
    const provider = await this.rpcProviderService.getProvider(network);
    try {
      const receipt = await this.transactionService.waitForTransaction(
        txHash,
        provider,
        confirmations
      );
      return receipt.status === 1; // 1 means success
    } catch (error) {
      this.logger.error(`Failed to monitor transaction ${txHash}: ${error.message}`);
      return false;
    }
  }
}