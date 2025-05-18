# Blockchain System Architecture

## Overview

The blockchain system in AliveHuman provides the foundation for token management, wallet authentication, and on-chain operations. It integrates with the Polygon network and manages the SHAHI token, which forms the core economy of the platform.

## File Structure

```
packages/backend/src/blockchain/
├── abis/                    # Contract ABIs for interacting with smart contracts
│   ├── IERC20.json          # ERC20 standard ABI
│   └── SHAHIToken.json      # SHAHI token contract ABI
├── blockchain.module.ts     # NestJS module definition for blockchain components
├── blockchain.service.ts    # Main service for blockchain operations
├── config/                  # Blockchain-specific configuration
│   ├── contracts.config.ts  # Smart contract addresses and parameters
│   ├── networks.config.ts   # Network configurations (mainnet, testnet)
│   └── rpc.config.ts        # RPC endpoint configuration
├── constants.ts             # Blockchain constants and fixed values
├── contracts/               # Smart contract source files
│   └── SHAHICoin.sol        # SHAHI token contract source
├── controllers/             # API endpoints for blockchain operations
│   ├── minting.controller.ts # Minting operations endpoints
│   └── token.controller.ts  # Token operations endpoints
├── dto/                     # Data transfer objects for blockchain requests/responses
│   ├── minting.dto.ts       # Minting request/response objects
│   └── token.dto.ts         # Token operation request/response objects
├── entities/                # Database entities for blockchain data
│   ├── minting-queue-item.entity.ts # Queue for token minting operations
│   └── transaction.entity.ts # Transaction record entity
├── enums/                   # Blockchain-related enumerations
│   ├── minting-status.enum.ts # Status of minting operations
│   └── minting-type.enum.ts # Types of minting operations
├── gateways/                # WebSocket gateways for real-time blockchain events
│   └── token-events.gateway.ts # Real-time token transaction notifications
├── guards/                  # Route guards for blockchain endpoints
│   └── rate-limit.guard.ts  # Rate limiting for minting operations
├── hot-wallet.module.ts     # Hot wallet module definition
├── hot-wallet.service.ts    # Hot wallet service for server-side operations
├── hotwallet/               # Hot wallet components (see HotWalletSystem.md)
├── interfaces/              # Interface definitions
│   ├── blockchain-config.interface.ts # Blockchain configuration interface
│   └── transaction.interface.ts # Transaction data interface
├── services/                # Business logic services
│   ├── hot-wallet/          # Hot wallet services (see HotWalletSystem.md)
│   ├── merkle.service.ts    # Merkle tree service for token validation
│   ├── minting.service.ts   # Token minting service
│   ├── rpc-provider.service.ts # RPC provider with load balancing
│   ├── shahi-token.service.ts # SHAHI token interaction service
│   └── user-minting-queue.service.ts # Queue management for minting
├── tasks/                   # Scheduled tasks for blockchain operations
│   ├── balance-monitor.task.ts # Monitor wallet balances
│   └── minting-queue.task.ts # Process minting queue
├── test-connection.ts       # Utility for testing blockchain connectivity
├── types.ts                 # Type definitions for blockchain operations
├── utils/                   # Utility functions
│   ├── address.utils.ts     # Wallet address utilities
│   ├── contract.utils.ts    # Smart contract interaction utilities
│   └── transaction.utils.ts # Transaction utilities
└── wallet.controller.ts     # Wallet API endpoints
```

## Core Components

### 1. Blockchain Module

The `blockchain.module.ts` is the entry point that defines the NestJS module for blockchain operations:

```typescript
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MintingQueueItem, Transaction]),
    UserModule,
  ],
  controllers: [TokenController, MintingController, WalletController],
  providers: [
    BlockchainService,
    HotWalletService,
    RPCProviderService,
    MerkleService,
    MintingService,
    UserMintingQueueService,
    SHAHITokenService,
    // Scheduled tasks
    BalanceMonitorTask,
    MintingQueueTask,
  ],
  exports: [
    BlockchainService,
    HotWalletService,
    MintingService,
  ],
})
export class BlockchainModule {}
```

### 2. Blockchain Service

The `blockchain.service.ts` provides the core functionality for blockchain interactions:

```typescript
@Injectable()
export class BlockchainService {
  private readonly provider: ethers.providers.Provider;
  private readonly logger = new Logger(BlockchainService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly rpcProviderService: RPCProviderService,
  ) {
    this.provider = this.rpcProviderService.getProvider();
  }

  // Network methods
  async getNetwork(): Promise<Network> { /* ... */ }
  async switchNetwork(chainId: number): Promise<boolean> { /* ... */ }
  
  // Contract interaction methods
  getContractInstance(
    address: string,
    abi: any,
    signer?: ethers.Signer
  ): ethers.Contract { /* ... */ }

  // Transaction methods
  async getTransaction(txHash: string): Promise<TransactionResponse> { /* ... */ }
  async waitForTransaction(
    txHash: string, 
    confirmations = 1
  ): Promise<TransactionReceipt> { /* ... */ }
}
```

### 3. RPC Provider Service

The `rpc-provider.service.ts` provides load-balanced RPC connections:

```typescript
@Injectable()
export class RPCProviderService {
  private providers: Map<number, ethers.providers.Provider[]> = new Map();
  private activeProviders: Map<number, ethers.providers.Provider> = new Map();
  private readonly logger = new Logger(RPCProviderService.name);
  
  constructor(private readonly configService: ConfigService) {
    this.initializeProviders();
  }
  
  // Initialize RPC providers from configuration
  private initializeProviders(): void { /* ... */ }
  
  // Get provider for specific network
  getProvider(chainId?: number): ethers.providers.Provider { /* ... */ }
  
  // Fall back to alternative RPC if the primary fails
  switchToFallbackProvider(chainId: number): boolean { /* ... */ }
  
  // Health check for provider
  async healthCheck(provider: ethers.providers.Provider): Promise<boolean> { /* ... */ }
}
```

### 4. SHAHI Token Service

The `shahi-token.service.ts` handles all SHAHI token operations:

```typescript
@Injectable()
export class SHAHITokenService {
  private tokenContract: ethers.Contract;
  private readonly logger = new Logger(SHAHITokenService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly blockchainService: BlockchainService,
    private readonly hotWalletService: HotWalletService,
  ) {
    this.initializeTokenContract();
  }
  
  // Initialize token contract from ABI
  private initializeTokenContract(): void { /* ... */ }
  
  // Token info methods
  async getTokenName(): Promise<string> { /* ... */ }
  async getTokenSymbol(): Promise<string> { /* ... */ }
  async getTokenDecimals(): Promise<number> { /* ... */ }
  async getTokenTotalSupply(): Promise<BigNumber> { /* ... */ }
  
  // Balance operations
  async getTokenBalance(address: string): Promise<BigNumber> { /* ... */ }
  
  // Transfer operations
  async transfer(
    to: string, 
    amount: BigNumber
  ): Promise<TransactionResponse> { /* ... */ }
  
  // Admin operations
  async mint(
    to: string, 
    amount: BigNumber
  ): Promise<TransactionResponse> { /* ... */ }
}
```

### 5. Minting System

The minting system consists of several components that work together:

#### 5.1 Minting Service

The `minting.service.ts` handles token minting operations:

```typescript
@Injectable()
export class MintingService {
  private readonly logger = new Logger(MintingService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly hotWalletService: HotWalletService,
    private readonly shahiTokenService: SHAHITokenService,
    private readonly merkleService: MerkleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  
  // First-time minting for new users
  async mintFirstTime(
    userId: string,
    walletAddress: string
  ): Promise<TransactionResponse> { /* ... */ }
  
  // Annual minting for returning users
  async mintAnnual(
    userId: string,
    walletAddress: string
  ): Promise<TransactionResponse> { /* ... */ }
  
  // Batch minting for optimized gas usage
  async processBatchMint(
    mintingRequests: MintingRequest[]
  ): Promise<TransactionResponse> { /* ... */ }
  
  // Verify minting eligibility
  async verifyMintingEligibility(
    userId: string,
    mintingType: MintingType
  ): Promise<boolean> { /* ... */ }
  
  // Record minting operations
  private async recordMintingOperation(
    userId: string,
    walletAddress: string,
    amount: BigNumber,
    txHash: string,
    mintingType: MintingType
  ): Promise<void> { /* ... */ }
}
```

#### 5.2 User Minting Queue Service

The `user-minting-queue.service.ts` manages the minting queue:

```typescript
@Injectable()
export class UserMintingQueueService {
  private readonly logger = new Logger(UserMintingQueueService.name);
  
  constructor(
    @InjectRepository(MintingQueueItem)
    private mintingQueueRepo: Repository<MintingQueueItem>,
    private configService: ConfigService,
  ) {}
  
  // Add to minting queue
  async addToQueue(
    userId: string,
    walletAddress: string,
    mintingType: MintingType,
    amount: string
  ): Promise<MintingQueueItem> { /* ... */ }
  
  // Get pending items for batch processing
  async getPendingItems(
    limit: number
  ): Promise<MintingQueueItem[]> { /* ... */ }
  
  // Update item status after processing
  async updateStatus(
    id: string,
    status: MintingStatus,
    txHash?: string
  ): Promise<MintingQueueItem> { /* ... */ }
  
  // Check if user has pending minting
  async hasPendingMinting(
    userId: string, 
    mintingType: MintingType
  ): Promise<boolean> { /* ... */ }
}
```

#### 5.3 Merkle Service

The `merkle.service.ts` provides Merkle proof verification for token validation:

```typescript
@Injectable()
export class MerkleService {
  private readonly logger = new Logger(MerkleService.name);
  private merkleTree: MerkleTree;
  
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.initializeMerkleTree();
  }
  
  // Initialize Merkle tree with eligible user addresses
  private async initializeMerkleTree(): Promise<void> { /* ... */ }
  
  // Generate Merkle proof for a wallet address
  generateProof(address: string): Buffer[] { /* ... */ }
  
  // Verify Merkle proof
  verifyProof(
    address: string, 
    proof: Buffer[]
  ): boolean { /* ... */ }
  
  // Regenerate tree when user list changes
  async regenerateMerkleTree(): Promise<void> { /* ... */ }
}
```

### 6. Token Events Gateway

The `token-events.gateway.ts` provides real-time notifications for token operations:

```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'blockchain',
})
export class TokenEventsGateway 
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TokenEventsGateway.name);
  
  constructor(private readonly shahiTokenService: SHAHITokenService) {}
  
  // Listen for minting events
  @OnEvent('shahi.mint.*')
  handleMintEvent(payload: any) {
    this.server.emit('mintEvent', payload);
  }
  
  // Listen for transfer events
  @OnEvent('shahi.transfer.*')
  handleTransferEvent(payload: any) {
    this.server.emit('transferEvent', payload);
  }
  
  // Socket connection lifecycle
  afterInit(server: Server) { /* ... */ }
  handleConnection(client: Socket, ...args: any[]) { /* ... */ }
  handleDisconnect(client: Socket) { /* ... */ }
}
```

## Configuration

Blockchain configuration is defined in `config/blockchain.config.ts`:

```typescript
export default registerAs('blockchain', () => ({
  networks: {
    polygon: {
      chainId: process.env.POLYGON_CHAIN_ID || '137',
      rpcUrls: (process.env.POLYGON_RPC_URLS || '').split(','),
      fallbackRpcUrls: (process.env.POLYGON_FALLBACK_RPC_URLS || '').split(','),
      blockExplorerUrl: process.env.POLYGON_BLOCK_EXPLORER_URL || 'https://polygonscan.com',
    },
    mumbai: {
      chainId: process.env.MUMBAI_CHAIN_ID || '80001',
      rpcUrls: (process.env.MUMBAI_RPC_URLS || '').split(','),
      fallbackRpcUrls: (process.env.MUMBAI_FALLBACK_RPC_URLS || '').split(','),
      blockExplorerUrl: process.env.MUMBAI_BLOCK_EXPLORER_URL || 'https://mumbai.polygonscan.com',
    },
  },
  contracts: {
    shahiToken: {
      address: process.env.SHAHI_TOKEN_ADDRESS,
      adminAddress: process.env.SHAHI_TOKEN_ADMIN_ADDRESS,
    },
  },
  minting: {
    batchEnabled: process.env.BATCH_MINTING_ENABLED === 'true',
    batchMaxSize: parseInt(process.env.BATCH_MINTING_MAX_SIZE || '10', 10),
    batchIntervalMs: parseInt(process.env.BATCH_MINTING_INTERVAL_MS || '300000', 10),
    firstTimeAmount: process.env.FIRST_TIME_MINT_AMOUNT || '0.5',
    annualAmount: process.env.ANNUAL_MINT_AMOUNT || '0.5',
    expiryDays: parseInt(process.env.TOKEN_EXPIRY_DAYS || '365', 10),
  },
}));
```

## Database Entities

### Minting Queue Item

The `minting-queue-item.entity.ts` defines the structure for minting queue records:

```typescript
@Entity('minting_queue_items')
export class MintingQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  userId: string;
  
  @Column()
  walletAddress: string;
  
  @Column({ type: 'enum', enum: MintingType, default: MintingType.FIRST_TIME })
  mintingType: MintingType;
  
  @Column({ type: 'enum', enum: MintingStatus, default: MintingStatus.PENDING })
  status: MintingStatus;
  
  @Column()
  amount: string;
  
  @Column({ nullable: true })
  txHash: string;
  
  @Column({ nullable: true })
  errorMessage: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ nullable: true })
  processedAt: Date;
}
```

## Integration with Other Modules

The blockchain system integrates with several other modules:

1. **User Module**: For retrieving user data and eligibility for minting
2. **Auth Module**: For wallet-based authentication
3. **Wallets Module**: For managing wallet connections
4. **Config Module**: For loading configuration values

## Flow Diagrams

### Minting Flow

```
User Request → MintingController → MintingService → UserMintingQueueService
                                                  → MerkleService
                                                  → HotWalletService
                                                  → SHAHITokenService
                                                  → EventEmitter (notifications)
```

### Token Transfer Flow

```
Transfer Request → TokenController → SHAHITokenService → HotWalletService
                                                       → RPC Provider
                                                       → Blockchain
                                                       → EventEmitter (notifications)
```

## Scheduled Tasks

The system includes scheduled tasks for automated operations:

1. **MintingQueueTask**: Processes pending minting requests in batches for gas optimization
2. **BalanceMonitorTask**: Monitors hot wallet balance and alerts if it falls below threshold

## Utility Functions

The blockchain module includes utilities for:

1. Address validation and formatting
2. Contract interaction helpers
3. Transaction signing and broadcasting
4. Gas estimation and optimization

## Testing

The `test-connection.ts` utility provides functionality to test blockchain connectivity:

```typescript
export async function testBlockchainConnection() {
  try {
    // Test provider connection
    const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URLS.split(',')[0]);
    const network = await provider.getNetwork();
    console.log('Connected to network:', network.name, network.chainId);
    
    // Test contract connection
    const tokenAddress = process.env.SHAHI_TOKEN_ADDRESS;
    const tokenAbi = require('./abis/SHAHIToken.json');
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    const tokenName = await tokenContract.name();
    const tokenSymbol = await tokenContract.symbol();
    console.log('Token contract connected:', tokenName, tokenSymbol);
    
    return true;
  } catch (error) {
    console.error('Blockchain connection test failed:', error);
    return false;
  }
}
```

## Conclusion

The blockchain system provides the necessary infrastructure for managing tokens, wallets, and on-chain operations within the AliveHuman platform. It is designed with security, scalability, and gas optimization in mind, following best practices for blockchain development and integration.
