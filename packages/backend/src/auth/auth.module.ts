import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

// Services
import { AuthService } from './services/auth.service';
import { WalletAuthService } from './services/wallet-auth.service';
import { Web3AuthService } from './services/web3-auth.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { WalletStrategy } from './strategies/wallet.strategy';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { WalletAuthController } from './controllers/wallet-auth.controller';
import { Web3AuthController } from './controllers/web3-auth.controller';

// Entities
import { Session } from './entities/session.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    UsersModule,
    BlockchainModule,
    PassportModule,
    TypeOrmModule.forFeature([Session, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get('auth.jwtExpiry', '1d'),
        },
      }),
    }),
  ],
  controllers: [AuthController, WalletAuthController, Web3AuthController],
  providers: [
    AuthService,
    WalletAuthService,
    Web3AuthService,
    JwtStrategy,
    LocalStrategy,
    WalletStrategy,
  ],
  exports: [AuthService, WalletAuthService, Web3AuthService],
})
})
export class AuthModule {}