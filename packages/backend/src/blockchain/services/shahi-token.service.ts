import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { RpcProviderService } from './rpc-provider.service';
import { HotWalletService } from './hot-wallet/hot-wallet.service';

// SHAHI Token ABI - this would typically be imported from a JSON file
// This is a simplified version of the ABI with just the essential functions
const SHAHI_TOKEN_ABI = [
  // ERC20 functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  // SHAHI-specific functions
  'function merkleRoot() view returns (bytes32)',
  'function setMerkleRoot(bytes32 _merkleRoot)',
  'function hasClaimed(address account) view returns (bool)',
  'function claim(uint256 amount, bytes32[] calldata merkleProof)',
  'function mint(address to, uint256 amount)',
  'function batchMint(address[] calldata recipients, uint256[] calldata amounts)',
  'function authorizedMinters(address minter) view returns (bool)',
  'function setAuthorizedMinterRole(address minter, bool authorized)',
  'function pause()',
  'function unpause()',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

@Injectable()
export class ShahiTokenService {
  private readonly logger = new Logger(ShahiTokenService.name);
  private readonly contractAddresses: { 
    shahiToken: string; 
    shahiTokenMumbai: string; 
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly rpcProviderService: RpcProviderService,
    private readonly hotWalletService: HotWalletService,
  ) {
    this.contractAddresses = {
      shahiToken: this.configService.get<string>('blockchain.contractAddresses.shahiToken'),
      shahiTokenMumbai: this.configService.get<string>('blockchain.contractAddresses.shahiTokenMumbai'),
    };

    if (!this.contractAddresses.shahiToken || !this.contractAddresses.shahiTokenMumbai) {
      this.logger.warn('SHAHI token contract addresses not fully configured');
    }
  }

  /**
   * Get the contract address for the specified network
   * @param network Blockchain network
   * @returns Contract address
   */
  getContractAddress(network: 'polygon' | 'mumbai'): string {
    if (network === 'polygon') {
      return this.contractAddresses.shahiToken;
    } else {
      return this.contractAddresses.shahiTokenMumbai;
    }
  }

  /**
   * Get a read-only contract instance
   * @param network Blockchain network
   * @returns Ethers contract instance
   */
  async getReadContract(network: 'polygon' | 'mumbai'): Promise<ethers.Contract> {
    const contractAddress = this.getContractAddress(network);
    if (!contractAddress) {
      throw new Error(`Contract address not configured for network: ${network}`);
    }

    const provider = await this.rpcProviderService.getProvider(network);
    return new ethers.Contract(contractAddress, SHAHI_TOKEN_ABI, provider);
  }

  /**
   * Get a writable contract instance (for transactions)
   * @param network Blockchain network
   * @returns Ethers contract instance
   */
  async getWriteContract(network: 'polygon' | 'mumbai'): Promise<ethers.Contract> {
    const contractAddress = this.getContractAddress(network);
    if (!contractAddress) {
      throw new Error(`Contract address not configured for network: ${network}`);
    }

    const provider = await this.rpcProviderService.getProvider(network);
    const wallet = await this.hotWalletService.keyManagementService.getWallet(provider);
    return new ethers.Contract(contractAddress, SHAHI_TOKEN_ABI, wallet);
  }

  /**
   * Helper method to call a contract read method
   * @param network Blockchain network
   * @param method Function to call with the contract
   */
  private async contractCall<T>(
    network: 'polygon' | 'mumbai',
    method: (contract: ethers.Contract) => Promise<T>
  ): Promise<T> {
    try {
      const contract = await this.getReadContract(network);
      return await method(contract);
    } catch (error) {
      this.logger.error(`Contract call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the token name
   * @param network Blockchain network
   */
  async getName(network: 'polygon' | 'mumbai' = 'polygon'): Promise<string> {
    return this.contractCall(network, contract => contract.name());
  }

  /**
   * Get the token symbol
   * @param network Blockchain network
   */
  async getSymbol(network: 'polygon' | 'mumbai' = 'polygon'): Promise<string> {
    return this.contractCall(network, contract => contract.symbol());
  }

  /**
   * Get the token decimals
   * @param network Blockchain network
   */
  async getDecimals(network: 'polygon' | 'mumbai' = 'polygon'): Promise<number> {
    return this.contractCall(network, contract => contract.decimals());
  }

  /**
   * Get the token total supply
   * @param network Blockchain network
   */
  async getTotalSupply(network: 'polygon' | 'mumbai' = 'polygon'): Promise<string> {
    const totalSupply = await this.contractCall(network, contract => contract.totalSupply());
    return totalSupply.toString();
  }

  /**
   * Get the token balance for an address
   * @param address Account address
   * @param network Blockchain network
   */
  async getBalance(address: string, network: 'polygon' | 'mumbai' = 'polygon'): Promise<string> {
    const balance = await this.contractCall(network, contract => contract.balanceOf(address));
    return balance.toString();
  }

  /**
   * Get the current merkle root
   * @param network Blockchain network
   */
  async getMerkleRoot(network: 'polygon' | 'mumbai' = 'polygon'): Promise<string> {
    return this.contractCall(network, contract => contract.merkleRoot());
  }

  /**
   * Check if an account has claimed tokens
   * @param address Account address
   * @param network Blockchain network
   */
  async hasClaimed(address: string, network: 'polygon' | 'mumbai' = 'polygon'): Promise<boolean> {
    return this.contractCall(network, contract => contract.hasClaimed(address));
  }

  /**
   * Transfer tokens from the hot wallet to a recipient
   * @param recipient Recipient address
   * @param amount Amount to transfer
   * @param network Blockchain network
   * @returns Transaction hash
   */
  async transfer(
    recipient: string, 
    amount: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    try {
      const contract = await this.getWriteContract(network);
      const tx = await contract.transfer(recipient, amount);
      const receipt = await tx.wait();
      this.logger.log(`Transfer successful: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Transfer failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mint tokens to a recipient
   * @param recipient Recipient address
   * @param amount Amount to mint
   * @param network Blockchain network
   * @returns Transaction hash
   */
  async mint(
    recipient: string,
    amount: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    try {
      const contract = await this.getWriteContract(network);
      const tx = await contract.mint(recipient, amount);
      const receipt = await tx.wait();
      this.logger.log(`Minting successful: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Minting failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch mint tokens to multiple recipients
   * @param recipients Array of recipient addresses
   * @param amounts Array of amounts to mint
   * @param network Blockchain network
   * @returns Transaction hash
   */
  async batchMint(
    recipients: string[],
    amounts: string[],
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    if (recipients.length !== amounts.length) {
      throw new Error('Recipients and amounts arrays must be the same length');
    }

    try {
      const contract = await this.getWriteContract(network);
      const tx = await contract.batchMint(recipients, amounts);
      const receipt = await tx.wait();
      this.logger.log(`Batch minting successful: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Batch minting failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set the merkle root for token claiming
   * @param merkleRoot New merkle root
   * @param network Blockchain network
   * @returns Transaction hash
   */
  async setMerkleRoot(
    merkleRoot: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    try {
      const contract = await this.getWriteContract(network);
      const tx = await contract.setMerkleRoot(merkleRoot);
      const receipt = await tx.wait();
      this.logger.log(`Merkle root set: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Setting merkle root failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Authorize or deauthorize a minter
   * @param minter Minter address
   * @param authorized Whether the address should be authorized
   * @param network Blockchain network
   * @returns Transaction hash
   */
  async setAuthorizedMinter(
    minter: string,
    authorized: boolean,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    try {
      const contract = await this.getWriteContract(network);
      const tx = await contract.setAuthorizedMinterRole(minter, authorized);
      const receipt = await tx.wait();
      this.logger.log(`Minter ${minter} ${authorized ? 'authorized' : 'deauthorized'}: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Setting authorized minter failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if an address is an authorized minter
   * @param minter Minter address
   * @param network Blockchain network
   */
  async isAuthorizedMinter(
    minter: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<boolean> {
    return this.contractCall(network, contract => contract.authorizedMinters(minter));
  }

  /**
   * Get the current block number
   * @param network Blockchain network
   */
  async getBlockNumber(network: 'polygon' | 'mumbai' = 'polygon'): Promise<number> {
    const provider = await this.rpcProviderService.getProvider(network);
    return provider.getBlockNumber();
  }
}