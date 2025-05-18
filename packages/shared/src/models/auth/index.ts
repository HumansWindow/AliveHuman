/**
 * Authentication-related types and interfaces
 */

export enum AuthProvider {
  EMAIL = 'email',
  WALLET = 'wallet',
  GOOGLE = 'google',
  TWITTER = 'twitter',
  DISCORD = 'discord',
}

export interface JwtPayload {
  sub: string; // user ID
  email?: string;
  walletAddress?: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  walletAddress?: string;
  signature?: string;
  provider?: AuthProvider;
}

export interface RegisterCredentials {
  email?: string;
  password?: string;
  walletAddress?: string;
  signature?: string;
  provider?: AuthProvider;
  referralCode?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email?: string;
    walletAddress?: string;
    role: string;
  };
  token: AuthToken;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface WalletLoginMessage {
  message: string;
  nonce: string;
}

// Web3 authentication exports
export * from './web3-auth';