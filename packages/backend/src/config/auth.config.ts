import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '1d',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  walletNonceExpiry: parseInt(process.env.WALLET_NONCE_EXPIRY || '300000', 10), // 5 minutes
}));