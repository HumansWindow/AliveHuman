# Web3 Systems Integration - Blockchain, Hot Wallet, and Authentication

## Overview

This document explains how the Web3 components (Blockchain, Hot Wallet, and Authentication) integrate with each other in the AliveHuman platform. These three systems form the backbone of the platform's blockchain functionality, enabling secure token operations, wallet authentication, and automated blockchain interactions.

## System Interaction Diagram

```
                 ┌─────────────────┐
                 │   Client App    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   API Gateway   │
                 └────────┬────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────┐              ┌─────────────────┐
│  Auth Module    │◄────────────►│ Blockchain Module│
│  - Web3Auth     │              │  - Token Service │
└────────┬────────┘              └────────┬────────┘
         │                                │
         │                                ▼
         │                       ┌─────────────────┐
         └──────────────────────►│  Hot Wallet     │
                                 │  - Transaction  │
                                 │  - Minting     │
                                 └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   Blockchain    │
                                 │   Network       │
                                 └─────────────────┘
```

## Key Integration Points

### 1. Authentication and Blockchain Integration

The Web3 authentication system and blockchain module integrate at several points:

#### 1.1 Wallet Verification

```typescript
// In Web3AuthService
private verifyWalletSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    this.logger.error(`Signature verification failed: ${error.message}`);
    return false;
  }
}
```

This functionality uses the same blockchain libraries (ethers.js) as the blockchain module to verify wallet signatures during authentication.

#### 1.2 User-Wallet Association

The authentication system associates users with their wallet addresses, which are then used by the blockchain module for operations like minting tokens:

```typescript
// In WalletService
async createWalletConnection(
  userId: string,
  walletAddress: string,
  isPrimary = false
): Promise<WalletConnection> {
  const wallet = this.walletConnectionRepository.create({
    user: { id: userId },
    address: walletAddress,
    isPrimary,
  });
  
  return await this.walletConnectionRepository.save(wallet);
}

// Usage in MintingService
async mintFirstTime(userId: string): Promise<TransactionResponse> {
  // Get user's wallet address
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['walletConnections'],
  });
  
  if (!user || !user.walletConnections?.length) {
    throw new BadRequestException('User has no connected wallet');
  }
  
  const primaryWallet = user.walletConnections.find(w => w.isPrimary);
  const walletAddress = primaryWallet?.address || user.walletConnections[0].address;
  
  // Rest of minting logic...
}
```

#### 1.3 Chain ID Tracking

The authentication system tracks which blockchain network (chain ID) the user authenticated from, and this information is used by the blockchain module to ensure operations happen on the correct network:

```typescript
// In Session entity
@Column({ nullable: true })
chainId: number;

// In BlockchainService
async ensureCorrectNetwork(chainId: number): Promise<boolean> {
  const currentNetwork = await this.getNetwork();
  
  if (currentNetwork.chainId !== chainId) {
    return await this.switchNetwork(chainId);
  }
  
  return true;
}
```

### 2. Blockchain and Hot Wallet Integration

The blockchain module uses the hot wallet for server-side operations that require private key signing.

#### 2.1 Token Minting

```typescript
// In MintingService
async mintFirstTime(
  userId: string,
  walletAddress: string
): Promise<TransactionResponse> {
  // Verify eligibility
  await this.verifyMintingEligibility(userId, MintingType.FIRST_TIME);
  
  // Get token amount
  const amount = ethers.utils.parseEther(
    this.configService.get('blockchain.minting.firstTimeAmount', '0.5')
  );
  
  // Use hot wallet to mint tokens
  const tx = await this.hotWalletService.executeContract(
    this.shahiTokenContractAddress,
    SHAHITokenABI,
    'mint',
    [walletAddress, amount],
    { purpose: 'First Time Minting' }
  );
  
  // Record the minting operation
  await this.recordMintingOperation(
    userId,
    walletAddress,
    amount,
    tx.hash,
    MintingType.FIRST_TIME
  );
  
  // Emit event for real-time notifications
  this.eventEmitter.emit('shahi.mint.firstTime', {
    userId,
    walletAddress,
    amount: amount.toString(),
    txHash: tx.hash,
  });
  
  return tx;
}
```

#### 2.2 Batch Operations

The blockchain module's minting queue service batches transactions through the hot wallet to optimize gas usage:

```typescript
// In MintingQueueTask
@Cron('*/5 * * * *') // Every 5 minutes
async processMintingQueue() {
  if (!this.configService.get<boolean>('blockchain.minting.batchEnabled', false)) {
    return; // Batch minting disabled
  }
  
  const batchSize = this.configService.get<number>('blockchain.minting.batchMaxSize', 10);
  
  // Get pending items from the queue
  const pendingItems = await this.userMintingQueueService.getPendingItems(batchSize);
  
  if (pendingItems.length === 0) {
    return; // No pending items
  }
  
  // Format batch mint requests
  const mintRequests = pendingItems.map(item => ({
    address: item.walletAddress,
    amount: ethers.utils.parseEther(item.amount),
    id: item.id,
  }));
  
  try {
    // Process batch mint using hot wallet
    const tx = await this.mintingService.processBatchMint(mintRequests);
    
    // Update all items with success status
    await Promise.all(
      pendingItems.map(item =>
        this.userMintingQueueService.updateStatus(
          item.id,
          MintingStatus.COMPLETED,
          tx.hash
        )
      )
    );
    
    this.logger.log(`Batch minting completed: ${tx.hash}, items: ${pendingItems.length}`);
  } catch (error) {
    this.logger.error(`Batch minting failed: ${error.message}`);
    
    // Update all items with error status
    await Promise.all(
      pendingItems.map(item =>
        this.userMintingQueueService.updateStatus(
          item.id,
          MintingStatus.FAILED,
          null,
          error.message
        )
      )
    );
  }
}
```

### 3. Authentication and Hot Wallet Integration

While authentication and hot wallet systems don't directly integrate, they both interact through the blockchain module:

#### 3.1 Admin Operations

Authenticated administrators can trigger hot wallet operations through secure API endpoints:

```typescript
// In TokenController
@Post('admin/mint')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async adminMint(
  @Body() mintDto: AdminMintDto,
  @CurrentUser() user: User
): Promise<{ txHash: string }> {
  // Admin initiates minting via API, passes through auth guards
  const tx = await this.shahiTokenService.adminMint(
    mintDto.walletAddress,
    mintDto.amount
  );
  
  // Log the operation with admin user ID
  await this.auditLogService.log({
    userId: user.id,
    action: 'admin-mint',
    target: mintDto.walletAddress,
    details: {
      amount: mintDto.amount,
      txHash: tx.hash,
    },
  });
  
  return { txHash: tx.hash };
}

// In SHAHITokenService
async adminMint(
  to: string,
  amount: string
): Promise<TransactionResponse> {
  // Parse amount
  const tokenAmount = ethers.utils.parseEther(amount);
  
  // Execute contract method using hot wallet
  return await this.hotWalletService.executeContract(
    this.tokenContractAddress,
    this.tokenContractAbi,
    'mint',
    [to, tokenAmount],
    { purpose: 'Admin Mint' }
  );
}
```

## Data Flow Between Systems

### User Authentication and Token Minting Flow

1. **User Authentication**
   - User connects wallet to the application
   - System generates a nonce challenge
   - User signs the challenge with their wallet
   - Web3AuthService verifies the signature
   - User is authenticated and receives JWT tokens

2. **Token Eligibility Check**
   - When user requests SHAHI tokens
   - System checks if user is eligible for first-time or annual minting
   - MerkleService verifies eligibility using Merkle proofs

3. **Minting Request**
   - User requests token minting
   - Request is authenticated via JWT
   - MintingService adds request to queue
   - Guards verify one minting request per period

4. **Token Minting**
   - HotWalletService executes mint transaction
   - Transaction is sent to blockchain
   - SHAHITokenService monitors transaction status
   - User is notified of successful minting via WebSocket

## Configuration Dependencies

The three systems share configuration values to ensure consistent behavior:

```typescript
// Shared configurations
export default registerAs('blockchain', () => ({
  networks: {
    polygon: {
      chainId: process.env.POLYGON_CHAIN_ID || '137',
      // Other network configs...
    },
    // Other networks...
  },
  
  contracts: {
    shahiToken: {
      address: process.env.SHAHI_TOKEN_ADDRESS,
      // Other contract configs...
    },
  },
  
  hotWallet: {
    address: process.env.HOT_WALLET_ADDRESS,
    encryptedKey: process.env.HOT_WALLET_ENCRYPTED_KEY,
    encryptionKey: process.env.HOT_WALLET_ENCRYPTION_KEY,
    // Other hot wallet configs...
  },
  
  minting: {
    // Minting configs...
  },
}));

export default registerAs('auth', () => ({
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  // Other auth configs...
  
  web3: {
    nonceExpirySeconds: process.env.AUTH_NONCE_EXPIRY_SECONDS || '300',
    // Other web3 auth configs...
  },
}));
```

## Security Considerations

### Cross-System Security

1. **JWT-Based Authorization**
   - All blockchain operations that affect user data require JWT authentication
   - Role-based permissions for admin operations
   - Session validation for each request

2. **Wallet-User Verification**
   - Operations that affect a user's tokens verify the wallet belongs to that user
   - Multi-wallet support with primary wallet designation
   - Device-wallet association for additional security

3. **Hot Wallet Protection**
   - Hot wallet operations are only exposed through authenticated admin APIs
   - Private key encryption at rest
   - Transaction rate limiting and monitoring

## Error Handling and Recovery

### Cross-System Error Handling

1. **Transaction Failures**
   - If a transaction fails, it's recorded in the minting queue
   - Automatic retry mechanism for failed transactions
   - Admin dashboard for monitoring and manual intervention

2. **Authentication Failures**
   - Security flags for suspicious authentication attempts
   - Detailed logging for security auditing
   - Progressive security measures based on risk level

3. **Network Issues**
   - RPC provider fallback mechanism
   - Transaction queue persistence across service restarts
   - Health monitoring and alerting

## Monitoring and Logging

### Integrated Monitoring

The three systems share monitoring and logging infrastructure:

```typescript
// Example of cross-system logging
@Injectable()
export class BlockchainLogger {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}
  
  async logTransaction(
    txHash: string,
    operation: string,
    userId?: string,
    walletAddress?: string,
    details?: any
  ): Promise<void> {
    // Create audit log entry
    const log = this.auditLogRepository.create({
      userId,
      walletAddress,
      operation,
      blockchainTxHash: txHash,
      details,
      timestamp: new Date(),
    });
    
    await this.auditLogRepository.save(log);
    
    // If this is a high-value operation, create an alert
    if (
      details?.value && 
      ethers.utils.parseEther(details.value).gt(
        ethers.utils.parseEther(this.configService.get('monitoring.highValueThreshold', '10'))
      )
    ) {
      // Send alert
      // Implementation...
    }
  }
}
```

## System Dependencies

The three systems have the following dependencies:

1. **Authentication System Dependencies**
   - Users Module (for user data)
   - Wallets Module (for wallet connections)
   - Config Module (for auth configuration)

2. **Blockchain Module Dependencies**
   - Auth Module (for authentication)
   - Hot Wallet Module (for transactions)
   - Config Module (for blockchain configuration)
   - Users Module (for user data and eligibility)

3. **Hot Wallet Module Dependencies**
   - Config Module (for hot wallet configuration)
   - Blockchain Module (for RPC provider)

## Setup and Initialization Order

For proper system initialization, the modules should be loaded in the following order:

1. **Config Module** - Provides configuration for all systems
2. **Database Module** - Provides entity repositories
3. **Users Module** - Provides user data access
4. **Wallets Module** - Provides wallet connection management
5. **Hot Wallet Module** - Initializes hot wallet capabilities
6. **Blockchain Module** - Sets up blockchain services
7. **Auth Module** - Configures authentication with blockchain integration

## Testing Strategy

### Integrated Testing

1. **Authentication Testing**
   - Mock wallet signatures for testing authentication
   - Test device fingerprinting and geolocation validation
   - Verify JWT token generation and validation

2. **Blockchain Testing**
   - Use test networks (Mumbai Testnet)
   - Mock RPC responses for unit testing
   - End-to-end tests for full token minting flow

3. **Hot Wallet Testing**
   - Test key encryption/decryption
   - Test contract interaction with mock contracts
   - Test transaction nonce management

## Conclusion

The Web3 Authentication, Blockchain, and Hot Wallet systems work together to provide a secure, scalable foundation for the AliveHuman platform's blockchain capabilities. By following the integration patterns described in this document, the systems maintain clear boundaries while cooperating to deliver the platform's Web3 functionality.

The modularity of the design allows for independent evolution of each system while maintaining compatibility through well-defined interfaces. This architecture supports future expansion to additional blockchain networks, token types, and authentication methods.
