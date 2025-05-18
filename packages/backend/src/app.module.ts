import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { UsersModule } from './users/users.module';
import { DiaryModule } from './diary/diary.module';
import { GameModule } from './game/game.module';
import { NotificationModule } from './notification/notification.module';
import { ReferralModule } from './referral/referral.module';
import { databaseConfig } from './config/database.config';
import { authConfig } from './config/auth.config';
import { blockchainConfig } from './config/blockchain.config';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, authConfig, blockchainConfig],
    }),
    
    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host', 'localhost'),
        port: configService.get('database.port', 5432),
        username: configService.get('database.username', 'postgres'),
        password: configService.get('database.password', 'postgres'),
        database: configService.get('database.database', 'alivehuman'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize', false),
        logging: configService.get('database.logging', false),
        ssl: configService.get('database.ssl', false) 
          ? { rejectUnauthorized: false } 
          : undefined,
      }),
    }),
    
    // Application modules
    AuthModule,
    BlockchainModule,
    UsersModule,
    DiaryModule,
    GameModule,
    NotificationModule,
    ReferralModule,
  ],
})
export class AppModule {}