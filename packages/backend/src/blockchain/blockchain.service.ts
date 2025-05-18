import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcProviderService } from './services/rpc-provider.service';
import { ShahiTokenService } from './services/shahi-token.service';
import { MintingService } from './services/minting.service';
import { HotWalletService } from './services/hot-wallet/hot-wallet.service';
import { MerkleService } from './services/merkle.service';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly rpcProviderService: RpcProviderService,
    private readonly shahiTokenService: ShahiTokenService,
    private readonly mintingService: MintingService,
    private readonly hotWalletService: HotWalletService,
    private readonly merkleService: MerkleService,
  ) {
    this.logger.log('Blockchain service initialized');
  }

  /**
   * Get the health status of blockchain RPC providers
   * @returns Health status of RPC providers
   */
  async getRpcStatus(): Promise<any> {
    return this.rpcProviderService.getProviderHealth();
  }

  /**
   * Get token information
   * @param network Blockchain network
   * @returns Token information
   */
  async getTokenInfo(network: 'polygon' | 'mumbai' = 'polygon'): Promise<any> {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.shahiTokenService.getName(network),
      this.shahiTokenService.getSymbol(network),
      this.shahiTokenService.getDecimals(network),
      this.shahiTokenService.getTotalSupply(network),
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply,
      contractAddress: this.shahiTokenService.getContractAddress(network),
    };
  }

  /**
   * Request token minting for a user
   * @param userId User ID
   * @param amount Amount to mint
   * @param recipientAddress Recipient wallet address
   * @param priority Priority level (higher = higher priority)
   * @returns The created minting record
   */
  async requestTokenMinting(
    userId: string,
    amount: string,
    recipientAddress: string,
    priority: number = 0
  ): Promise<any> {
    return this.mintingService.requestMinting(
      userId,
      amount,
      recipientAddress,
      priority
    );
  }

  /**
   * Get user minting history
   * @param userId User ID
   * @returns User's minting history
   */
  async getUserMintingHistory(userId: string): Promise<any> {
    return this.mintingService.getUserMintingHistory(userId);
  }

  /**
   * Check if a user has claimed tokens
   * @param address User wallet address
   * @param network Blockchain network
   * @returns Whether the user has claimed tokens
   */
  async hasUserClaimedTokens(
    address: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<boolean> {
    return this.shahiTokenService.hasClaimed(address, network);
  }

  /**
   * Get user token balance
   * @param address User wallet address
   * @param network Blockchain network
   * @returns User's token balance
   */
  async getUserTokenBalance(
    address: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    return this.shahiTokenService.getBalance(address, network);
  }

  /**
   * Generate Merkle tree for token claims
   * @param whitelist Array of address and amount pairs
   * @returns Generated Merkle root
   */
  async generateWhitelistMerkleTree(
    whitelist: Array<{ address: string; amount: string }>
  ): Promise<string> {
    const merkleRoot = this.merkleService.generateMerkleTree(whitelist);
    return merkleRoot;
  }

  /**
   * Set the Merkle root on the contract
   * @param merkleRoot Merkle root hash
   * @param network Blockchain network
   * @returns Transaction hash
   */
  async setWhitelistMerkleRoot(
    merkleRoot: string,
    network: 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    return this.shahiTokenService.setMerkleRoot(merkleRoot, network);
  }

  /**
   * Get proof for user claim
   * @param address User address
   * @param amount Amount to claim
   * @returns Merkle proof for the claim
   */
  getClaimProof(address: string, amount: string): string[] {
    return this.merkleService.getMerkleProof(address, amount);
  }

  /**
   * Verify if a user is eligible for claim
   * @param address User address
   * @param amount Amount to claim
   * @returns Whether the user is eligible
   */
  verifyClaimEligibility(address: string, amount: string): boolean {
    return this.merkleService.verifyMerkleProof(address, amount);
  }

  /**
   * Check if an address is whitelisted
   * @param address User address
   * @returns Whether the address is whitelisted
   */
  isAddressWhitelisted(address: string): boolean {
    return this.merkleService.isWhitelisted(address);
  }

  /**
   * Get the wallet balance of the hot wallet
   * @param network Blockchain network
   * @returns Hot wallet balance
   */
  async getHotWalletBalance(
    network: 'ethereum' | 'polygon' | 'mumbai' = 'polygon'
  ): Promise<string> {
    return this.hotWalletService.getWalletBalance(network);
  }

  /**
   * Get minting statistics
   * @returns Minting statistics
   */
  async getMintingStats(): Promise<any> {
    return this.mintingService.getMintingStats();
  }

  /**
   * Monitor a blockchain transaction
   * @param txHash Transaction hash
   * @param network Blockchain network
   * @returns Whether the transaction succeeded
   */
  async monitorTransaction(
    txHash: string,
    network: 'ethereum' | 'polygon' | 'mumbai' = 'polygon'
  ): Promise<boolean> {
    return this.hotWalletService.monitorTransaction(network, txHash);
  }
}