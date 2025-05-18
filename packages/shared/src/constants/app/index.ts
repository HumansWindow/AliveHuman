/**
 * Application constants used throughout the AliveHuman platform
 */

// App information
export const APP_NAME = 'AliveHuman';
export const APP_VERSION = '1.0.0';

// Feature flags for enabling/disabling functionality
export const FEATURES = {
  WALLET_CONNECTION: true,
  DIARY: true,
  GAME: true,
  REFERRALS: true,
  NOTIFICATIONS: true,
};

// Storage keys for local/session storage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  WALLET_CONNECTED: 'wallet_connected',
  LAST_NOTIFICATION_READ: 'last_notification_read',
  GAME_SETTINGS: 'game_settings',
};

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Time constants
export const TIME = {
  TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour in milliseconds
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes in milliseconds
  NOTIFICATION_POLLING: 30 * 1000, // 30 seconds in milliseconds
};

// File upload limits
export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  ALLOWED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg'],
};

// Blockchain networks
export const NETWORKS = {
  POLYGON: {
    name: 'Polygon',
    chainId: 137,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  MUMBAI: {
    name: 'Mumbai Testnet',
    chainId: 80001,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
};

// Social media links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/alivehuman',
  DISCORD: 'https://discord.gg/alivehuman',
  TELEGRAM: 'https://t.me/alivehuman',
  INSTAGRAM: 'https://instagram.com/alivehuman',
};

// Legal links
export const LEGAL_LINKS = {
  TERMS: '/legal/terms',
  PRIVACY: '/legal/privacy',
  COOKIES: '/legal/cookies',
};