# Hot Wallet System Architecture

## Overview

The Hot Wallet System in AliveHuman provides secure, server-side wallet functionality for executing blockchain transactions on behalf of the platform. It is primarily used for SHAHI token minting, batch operations, and administrative functions where the platform needs to interact with the blockchain directly without requiring user signatures.

## File Structure

```
packages/backend/src/blockchain/
├── hot-wallet.module.ts     # Hot wallet NestJS module definition
├── hot-wallet.service.ts    # Primary hot wallet service
└── hotwallet/               # Hot wallet components
    ├── encryption.service.ts # Encryption service for wallet keys
    ├── key-management.service.ts # Key management utilities
    ├── transaction.service.ts # Transaction management
    ├── gas-price.service.ts # Gas price estimation service
    └── wallet-health.service.ts # Wallet health monitoring
```

## Core Components

### 1. Hot Wallet Module

The `hot-wallet.module.ts` defines the NestJS module for hot wallet operations:

```typescript
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Transaction]),
  ],
  providers: [
    HotWalletService,
    EncryptionService,
    KeyManagementService,
    TransactionService,
    GasPriceService,
    WalletHealthService,
  ],
  exports: [
    HotWalletService,
  ],
})
export class HotWalletModule {}
```

### 2. Hot Wallet Service

The `hot-wallet.service.ts` is the main service for hot wallet operations:

```typescript
@Injectable()
export class HotWalletService {
  private wallet: ethers.Wallet;
  private readonly logger = new Logger(HotWalletService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly keyManagementService: KeyManagementService,
    private readonly transactionService: TransactionService,
    private readonly gasPriceService: GasPriceService,
    private readonly rpcProviderService: RPCProviderService,
  ) {
    this.initializeWallet();
  }
  
  // Initialize the hot wallet using the encrypted private key
  private async initializeWallet(): Promise<void> {
    const encryptedPrivateKey = this.configService.get<string>('blockchain.hotWallet.encryptedKey');
    const encryptionKey = this.configService.get<string>('blockchain.hotWallet.encryptionKey');
    
    if (!encryptedPrivateKey || !encryptionKey) {
      this.logger.error('Hot wallet configuration is missing');
      throw new Error('Hot wallet configuration is missing');
    }
    
    try {
      const privateKey = await this.keyManagementService.decryptPrivateKey(
        encryptedPrivateKey,
        encryptionKey
      );
      
      const provider = this.rpcProviderService.getProvider();
      this.wallet = new ethers.Wallet(privateKey, provider);
      
      this.logger.log(`Hot wallet initialized: ${this.wallet.address}`);
    } catch (error) {
      this.logger.error('Failed to initialize hot wallet', error);
      throw new Error('Failed to initialize hot wallet');
    }
  }
  
  // Get the hot wallet address
  getAddress(): string {
    return this.wallet.address;
  }
  
  // Get the hot wallet balance
  async getBalance(): Promise<BigNumber> {
    return await this.wallet.getBalance();
  }
  
  // Send native currency (MATIC/ETH)
  async sendNativeCurrency(
    to: string,
    amount: BigNumber,
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    try {
      const tx = await this.transactionService.sendTransaction(
        this.wallet,
        {
          to,
          value: amount,
        },
        options
      );
      
      this.logger.log(`Sent native currency: ${ethers.utils.formatEther(amount)} to ${to}. Tx hash: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error(`Failed to send native currency to ${to}`, error);
      throw new Error(`Failed to send native currency: ${error.message}`);
    }
  }
  
  // Execute contract transaction
  async executeContract(
    contractAddress: string,
    contractAbi: any,
    method: string,
    params: any[],
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    try {
      const contract = new ethers.Contract(contractAddress, contractAbi, this.wallet);
      
      const tx = await this.transactionService.executeContractTransaction(
        contract,
        method,
        params,
        options
      );
      
      this.logger.log(`Executed contract: ${contractAddress}.${method}(). Tx hash: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error(`Failed to execute contract ${contractAddress}.${method}()`, error);
      throw new Error(`Failed to execute contract: ${error.message}`);
    }
  }
  
  // Sign message (for off-chain verification)
  async signMessage(message: string): Promise<string> {
    try {
      const signature = await this.wallet.signMessage(message);
      this.logger.log('Message signed successfully');
      return signature;
    } catch (error) {
      this.logger.error('Failed to sign message', error);
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }
  
  // Sign typed data (EIP-712)
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    try {
      const signature = await this.wallet._signTypedData(domain, types, value);
      this.logger.log('Typed data signed successfully');
      return signature;
    } catch (error) {
      this.logger.error('Failed to sign typed data', error);
      throw new Error(`Failed to sign typed data: ${error.message}`);
    }
  }
}
```

### 3. Key Management Service

The `key-management.service.ts` handles secure storage and retrieval of private keys:

```typescript
@Injectable()
export class KeyManagementService {
  private readonly logger = new Logger(KeyManagementService.name);
  
  constructor(private readonly encryptionService: EncryptionService) {}
  
  // Generate a new private key
  generatePrivateKey(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.privateKey;
  }
  
  // Encrypt a private key for secure storage
  async encryptPrivateKey(
    privateKey: string,
    encryptionKey: string
  ): Promise<string> {
    try {
      return await this.encryptionService.encrypt(privateKey, encryptionKey);
    } catch (error) {
      this.logger.error('Failed to encrypt private key', error);
      throw new Error('Failed to encrypt private key');
    }
  }
  
  // Decrypt a private key for use
  async decryptPrivateKey(
    encryptedPrivateKey: string,
    encryptionKey: string
  ): Promise<string> {
    try {
      return await this.encryptionService.decrypt(encryptedPrivateKey, encryptionKey);
    } catch (error) {
      this.logger.error('Failed to decrypt private key', error);
      throw new Error('Failed to decrypt private key');
    }
  }
  
  // Validate a private key
  validatePrivateKey(privateKey: string): boolean {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return !!wallet.address;
    } catch (error) {
      return false;
    }
  }
}
```

### 4. Encryption Service

The `encryption.service.ts` provides encryption and decryption functionality:

```typescript
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  
  // Encrypt data with a key
  async encrypt(data: string, key: string): Promise<string> {
    try {
      // Generate a hash of the key for AES
      const keyHash = crypto.createHash('sha256').update(key).digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, keyHash, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      // Return the IV, encrypted data, and authentication tag as a combined string
      return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }
  
  // Decrypt data with a key
  async decrypt(encryptedData: string, key: string): Promise<string> {
    try {
      const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
      
      // Generate a hash of the key for AES
      const keyHash = crypto.createHash('sha256').update(key).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, keyHash, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }
}
```

### 5. Transaction Service

The `transaction.service.ts` handles transaction construction, gas estimation, and nonce management:

```typescript
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private nonceCache: Map<string, number> = new Map();
  
  constructor(
    private readonly gasPriceService: GasPriceService,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}
  
  // Send a transaction
  async sendTransaction(
    wallet: ethers.Wallet,
    txData: Partial<ethers.providers.TransactionRequest>,
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    try {
      const nonce = await this.getNonce(wallet.address);
      const gasPrice = await this.gasPriceService.getGasPrice(options?.gasPriority);
      
      const txRequest: ethers.providers.TransactionRequest = {
        ...txData,
        nonce,
        gasPrice,
        gasLimit: options?.gasLimit || await this.estimateGas(wallet.provider, txData),
      };
      
      const tx = await wallet.sendTransaction(txRequest);
      
      // Update nonce cache
      this.nonceCache.set(wallet.address, nonce + 1);
      
      // Store transaction in database
      await this.storeTransaction(wallet.address, tx.hash, txData, options);
      
      return tx;
    } catch (error) {
      this.logger.error('Transaction failed', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
  
  // Execute a contract method
  async executeContractTransaction(
    contract: ethers.Contract,
    method: string,
    params: any[],
    options?: TransactionOptions
  ): Promise<TransactionResponse> {
    try {
      const wallet = contract.signer as ethers.Wallet;
      const address = await wallet.getAddress();
      
      const nonce = await this.getNonce(address);
      const gasPrice = await this.gasPriceService.getGasPrice(options?.gasPriority);
      
      // Estimate gas
      const gasLimit = options?.gasLimit || 
        await contract.estimateGas[method](...params, { gasPrice });
      
      // Add a buffer to gas limit
      const gasLimitWithBuffer = gasLimit.mul(120).div(100); // 20% buffer
      
      // Execute the transaction
      const tx = await contract.functions[method](...params, {
        gasLimit: gasLimitWithBuffer,
        gasPrice,
        nonce,
      });
      
      // Update nonce cache
      this.nonceCache.set(address, nonce + 1);
      
      // Store transaction in database
      await this.storeTransaction(
        address,
        tx.hash,
        {
          to: contract.address,
          data: contract.interface.encodeFunctionData(method, params),
        },
        options
      );
      
      return tx;
    } catch (error) {
      this.logger.error(`Contract method execution failed: ${method}`, error);
      throw new Error(`Contract method execution failed: ${error.message}`);
    }
  }
  
  // Get the next nonce for an address
  private async getNonce(address: string): Promise<number> {
    const cachedNonce = this.nonceCache.get(address);
    
    if (cachedNonce !== undefined) {
      return cachedNonce;
    }
    
    // Query the blockchain for the current nonce
    const provider = ethers.getDefaultProvider();
    const nonce = await provider.getTransactionCount(address);
    
    this.nonceCache.set(address, nonce);
    return nonce;
  }
  
  // Estimate gas for a transaction
  private async estimateGas(
    provider: ethers.providers.Provider,
    txData: Partial<ethers.providers.TransactionRequest>
  ): Promise<BigNumber> {
    try {
      const gasEstimate = await provider.estimateGas(txData);
      
      // Add a 20% buffer
      return gasEstimate.mul(120).div(100);
    } catch (error) {
      this.logger.error('Gas estimation failed', error);
      // Return a default gas limit if estimation fails
      return BigNumber.from(300000); // 300k gas units
    }
  }
  
  // Store transaction record in database
  private async storeTransaction(
    fromAddress: string,
    txHash: string,
    txData: any,
    options?: TransactionOptions
  ): Promise<void> {
    const transaction = this.transactionRepository.create({
      fromAddress,
      toAddress: txData.to,
      txHash,
      value: txData.value ? ethers.utils.formatEther(txData.value) : '0',
      data: txData.data || '',
      gasPrice: txData.gasPrice ? ethers.utils.formatUnits(txData.gasPrice, 'gwei') : null,
      gasLimit: txData.gasLimit ? txData.gasLimit.toString() : null,
      purpose: options?.purpose || 'Unknown',
      status: 'Pending',
      networkId: options?.networkId || (await ethers.getDefaultProvider().getNetwork()).chainId,
    });
    
    await this.transactionRepository.save(transaction);
  }
}
```

### 6. Gas Price Service

The `gas-price.service.ts` provides gas price estimation:

```typescript
@Injectable()
export class GasPriceService {
  private readonly logger = new Logger(GasPriceService.name);
  
  constructor(private readonly configService: ConfigService) {}
  
  // Get current gas price based on priority
  async getGasPrice(priority: GasPriority = GasPriority.MEDIUM): Promise<BigNumber> {
    try {
      const provider = ethers.getDefaultProvider();
      const gasPrice = await provider.getGasPrice();
      
      // Apply multiplier based on priority
      switch (priority) {
        case GasPriority.LOW:
          return gasPrice.mul(90).div(100); // 90% of current gas price
        case GasPriority.HIGH:
          return gasPrice.mul(130).div(100); // 130% of current gas price
        case GasPriority.URGENT:
          return gasPrice.mul(200).div(100); // 200% of current gas price
        case GasPriority.MEDIUM:
        default:
          return gasPrice;
      }
    } catch (error) {
      this.logger.error('Failed to get gas price', error);
      
      // Return fallback gas price if retrieval fails
      return ethers.utils.parseUnits(
        this.configService.get<string>('blockchain.gasPrice.fallback', '50'),
        'gwei'
      );
    }
  }
  
  // Get EIP-1559 fee data
  async getEip1559FeeData(): Promise<FeeData> {
    try {
      const provider = ethers.getDefaultProvider();
      return await provider.getFeeData();
    } catch (error) {
      this.logger.error('Failed to get EIP-1559 fee data', error);
      
      // Return fallback fee data
      const gasPrice = ethers.utils.parseUnits(
        this.configService.get<string>('blockchain.gasPrice.fallback', '50'),
        'gwei'
      );
      
      return {
        gasPrice,
        maxFeePerGas: gasPrice.mul(2),
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
      };
    }
  }
}
```

### 7. Wallet Health Service

The `wallet-health.service.ts` monitors wallet health and balance:

```typescript
@Injectable()
export class WalletHealthService {
  private readonly logger = new Logger(WalletHealthService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly hotWalletService: HotWalletService,
  ) {}
  
  // Check if wallet balance is above threshold
  async checkBalance(): Promise<BalanceStatus> {
    try {
      const balance = await this.hotWalletService.getBalance();
      const minBalance = ethers.utils.parseEther(
        this.configService.get<string>('blockchain.hotWallet.minBalance', '0.1')
      );
      
      if (balance.lt(minBalance)) {
        this.logger.warn(`Hot wallet balance is low: ${ethers.utils.formatEther(balance)} ETH`);
        return {
          isHealthy: false,
          balance: ethers.utils.formatEther(balance),
          minBalance: ethers.utils.formatEther(minBalance),
        };
      }
      
      return {
        isHealthy: true,
        balance: ethers.utils.formatEther(balance),
        minBalance: ethers.utils.formatEther(minBalance),
      };
    } catch (error) {
      this.logger.error('Failed to check wallet balance', error);
      return {
        isHealthy: false,
        error: error.message,
      };
    }
  }
  
  // Send alert if balance is low
  async sendBalanceAlert(status: BalanceStatus): Promise<void> {
    if (!status.isHealthy) {
      // TODO: Implement alert mechanism (e.g. email, Slack, etc.)
      this.logger.warn(
        `ALERT: Hot wallet balance is low: ${status.balance} ETH (minimum: ${status.minBalance} ETH)`
      );
    }
  }
  
  // Check transaction history for pending transactions
  async checkPendingTransactions(): Promise<PendingTransactionsStatus> {
    try {
      // TODO: Implement pending transaction check
      return {
        isHealthy: true,
        pendingCount: 0,
      };
    } catch (error) {
      this.logger.error('Failed to check pending transactions', error);
      return {
        isHealthy: false,
        error: error.message,
      };
    }
  }
}
```

## Database Entity

The `transaction.entity.ts` keeps a record of transactions for auditing and monitoring:

```typescript
@Entity('blockchain_transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  fromAddress: string;
  
  @Column()
  toAddress: string;
  
  @Column()
  txHash: string;
  
  @Column({ default: '0' })
  value: string;
  
  @Column({ type: 'text', nullable: true })
  data: string;
  
  @Column({ nullable: true })
  gasPrice: string;
  
  @Column({ nullable: true })
  gasLimit: string;
  
  @Column()
  purpose: string;
  
  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: string;
  
  @Column()
  networkId: number;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ nullable: true })
  confirmedAt: Date;
  
  @Column({ nullable: true })
  errorMessage: string;
}
```

## Configuration

The hot wallet configuration is part of the blockchain configuration in `config/blockchain.config.ts`:

```typescript
export default registerAs('blockchain', () => ({
  // Other blockchain configs...

  hotWallet: {
    address: process.env.HOT_WALLET_ADDRESS,
    encryptedKey: process.env.HOT_WALLET_ENCRYPTED_KEY,
    encryptionKey: process.env.HOT_WALLET_ENCRYPTION_KEY,
    minBalance: process.env.HOT_WALLET_MIN_BALANCE || '0.1',
  },
  
  gasPrice: {
    fallback: process.env.GAS_PRICE_FALLBACK || '50', // gwei
    maxGasPrice: process.env.MAX_GAS_PRICE || '500', // gwei
  },
}));
```

## Security Considerations

The hot wallet system incorporates several security measures:

1. **Private Key Encryption**: The hot wallet's private key is stored in an encrypted format, requiring a separate encryption key for decryption.

2. **Environment Variable Isolation**: Sensitive values are stored as environment variables and not hard-coded in the application.

3. **Minimal Balance**: The hot wallet is designed to hold only the minimum amount necessary for operations, reducing the impact of a potential breach.

4. **Transaction Limiting**: Built-in rate limiting prevents excessive transaction volume.

5. **Monitoring**: Continuous monitoring alerts administrators of suspicious activity or balance issues.

## Setup and Key Management

The hot wallet setup involves several steps:

1. **Generate a new wallet**: Use the key management service to generate a new wallet.

2. **Encrypt the private key**: Encrypt the private key using a strong encryption key.

3. **Store in environment variables**: Store the encrypted private key and the encryption key in secure environment variables.

4. **Fund the wallet**: Transfer a small amount of native currency (MATIC) to the hot wallet address.

```typescript
// Example setup script (not included in production code)
async function setupHotWallet() {
  const keyManagementService = new KeyManagementService(new EncryptionService());
  
  // Generate a new wallet
  const privateKey = keyManagementService.generatePrivateKey();
  const wallet = new ethers.Wallet(privateKey);
  
  console.log('Hot wallet address:', wallet.address);
  
  // Generate a strong encryption key
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  
  // Encrypt the private key
  const encryptedKey = await keyManagementService.encryptPrivateKey(privateKey, encryptionKey);
  
  console.log('Add these to your .env file:');
  console.log(`HOT_WALLET_ADDRESS=${wallet.address}`);
  console.log(`HOT_WALLET_ENCRYPTED_KEY=${encryptedKey}`);
  console.log(`HOT_WALLET_ENCRYPTION_KEY=${encryptionKey}`);
}
```

## Operational Flow

### Contract Interaction Flow

```
Request → HotWalletService.executeContract()
        → TransactionService.executeContractTransaction()
        → GasPriceService.getGasPrice()
        → TransactionService.getNonce()
        → Transaction Broadcast to Blockchain
        → Transaction Record in Database
```

### Transaction Monitoring Flow

```
Scheduled Task → WalletHealthService.checkBalance()
               → WalletHealthService.checkPendingTransactions()
               → Alert Mechanism (if issues detected)
```

## Integration with Other Modules

The hot wallet system integrates with:

1. **Blockchain Module**: For blockchain connectivity and contract operations
2. **Minting Service**: For executing token minting operations
3. **Configuration Module**: For loading hot wallet configuration

## Best Practices

1. **Regular Key Rotation**: Periodically rotate the hot wallet private key to limit exposure.

2. **Minimal Funds**: Keep only minimal funds in the hot wallet, regularly transferring excess to cold storage.

3. **Transaction Batching**: Batch transactions when possible to reduce gas costs.

4. **Comprehensive Logging**: Log all wallet operations for auditing.

5. **Separation of Concerns**: Isolate the hot wallet logic from other application components.

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Insufficient funds | Implement automatic alerts and a funding mechanism |
| Pending transactions | Include a transaction unstuck mechanism with fee bumping |
| Nonce management | Use the nonce cache to prevent gaps and collisions |
| Gas price volatility | Implement adaptive gas pricing based on network conditions |
| Provider connectivity | Use the RPC load balancer for failover |

## Conclusion

The Hot Wallet System provides secure, reliable functionality for executing blockchain transactions on behalf of the AliveHuman platform. With proper configuration and monitoring, it enables automated token minting, batch operations, and administrative functions while maintaining a high level of security.
