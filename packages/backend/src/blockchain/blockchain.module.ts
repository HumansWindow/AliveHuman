import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { BlockchainService } from './blockchain.service';
import { RpcProviderService } from './services/rpc-provider.service';
import { MintingService } from './services/minting.service';
import { ShahiTokenService } from './services/shahi-token.service';
import { MerkleService } from './services/merkle.service';
import { UserMintingQueueService } from './services/user-minting-queue.service';
import { HotWalletService } from './services/hot-wallet/hot-wallet.service';
import { KeyManagementService } from './services/hot-wallet/key-management.service';
import { TransactionService } from './services/hot-wallet/transaction.service';

// Entities
import { MintingRecord } from './entities/minting-record.entity';
import { MintingQueue } from './entities/minting-queue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MintingRecord, MintingQueue]),
    ConfigModule,
  ],
  providers: [
    {
      provide: 'BLOCKCHAIN_CONFIG',
      useFactory: (configService: ConfigService) => ({
        rpcUrls: {
          ethereum: configService.get<string>('blockchain.rpcUrls.ethereum'),
          polygon: configService.get<string>('blockchain.rpcUrls.polygon'),
          mumbai: configService.get<string>('blockchain.rpcUrls.mumbai'),
        },
        contractAddresses: {
          shahiToken: configService.get<string>('blockchain.contractAddresses.shahiToken'),
          shahiTokenMumbai: configService.get<string>('blockchain.contractAddresses.shahiTokenMumbai'),
        },
        hotWallet: {
          address: configService.get<string>('blockchain.hotWallet.address'),
          encryptionKey: configService.get<string>('blockchain.hotWallet.encryptionKey'),
        },
      }),
      inject: [ConfigService],
    },
    BlockchainService,
    RpcProviderService,
    MintingService,
    ShahiTokenService,
    MerkleService,
    UserMintingQueueService,
    HotWalletService,
    KeyManagementService,
    TransactionService,
  ],
  exports: [
    BlockchainService,
    MintingService,
    ShahiTokenService,
    MerkleService,
    UserMintingQueueService,
    HotWalletService,
  ],
})
export class BlockchainModule {}