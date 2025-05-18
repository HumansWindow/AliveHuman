/**
 * API endpoint constants
 * This file defines all API endpoints used throughout the application
 */

// Base API paths
export const API_BASE = '/api';
export const API_VERSION = 'v1';
export const API_PATH = `${API_BASE}/${API_VERSION}`;

// Auth endpoints
export const AUTH_PATH = `${API_PATH}/auth`;
export const LOGIN = `${AUTH_PATH}/login`;
export const REGISTER = `${AUTH_PATH}/register`;
export const LOGOUT = `${AUTH_PATH}/logout`;
export const REFRESH_TOKEN = `${AUTH_PATH}/refresh-token`;
export const FORGOT_PASSWORD = `${AUTH_PATH}/forgot-password`;
export const RESET_PASSWORD = `${AUTH_PATH}/reset-password`;
export const WALLET_LOGIN_MESSAGE = `${AUTH_PATH}/wallet-login-message`;
export const WALLET_LOGIN = `${AUTH_PATH}/wallet-login`;

// User endpoints
export const USERS_PATH = `${API_PATH}/users`;
export const USER_PROFILE = `${USERS_PATH}/profile`;
export const USER_PREFERENCES = `${USERS_PATH}/preferences`;
export const USER_WALLET = `${USERS_PATH}/wallet`;
export const USER_CONNECT_WALLET = `${USERS_PATH}/connect-wallet`;

// Diary endpoints
export const DIARY_PATH = `${API_PATH}/diary`;
export const DIARY_ENTRIES = `${DIARY_PATH}/entries`;
export const DIARY_TAGS = `${DIARY_PATH}/tags`;
export const DIARY_MEDIA = `${DIARY_PATH}/media`;

// Game endpoints
export const GAME_PATH = `${API_PATH}/game`;
export const GAME_PROFILE = `${GAME_PATH}/profile`;
export const GAME_LEADERBOARD = `${GAME_PATH}/leaderboard`;
export const GAME_ACHIEVEMENTS = `${GAME_PATH}/achievements`;
export const GAME_INVENTORY = `${GAME_PATH}/inventory`;
export const GAME_SKILLS = `${GAME_PATH}/skills`;
export const GAME_PROGRESS = `${GAME_PATH}/progress`;

// Blockchain endpoints
export const BLOCKCHAIN_PATH = `${API_PATH}/blockchain`;
export const TOKENS = `${BLOCKCHAIN_PATH}/tokens`;
export const NFTS = `${BLOCKCHAIN_PATH}/nfts`;
export const TRANSACTIONS = `${BLOCKCHAIN_PATH}/transactions`;

// Notification endpoints
export const NOTIFICATION_PATH = `${API_PATH}/notifications`;
export const NOTIFICATION_SETTINGS = `${NOTIFICATION_PATH}/settings`;
export const NOTIFICATION_MARK_READ = `${NOTIFICATION_PATH}/mark-read`;

// Referral endpoints
export const REFERRAL_PATH = `${API_PATH}/referrals`;
export const REFERRAL_CODE = `${REFERRAL_PATH}/code`;
export const REFERRAL_INVITE = `${REFERRAL_PATH}/invite`;
export const REFERRAL_STATS = `${REFERRAL_PATH}/stats`;

// WebSocket endpoints
export const WS_PATH = '/ws';
export const WS_NOTIFICATIONS = `${WS_PATH}/notifications`;
export const WS_GAME = `${WS_PATH}/game`;
export const WS_CHAT = `${WS_PATH}/chat`;