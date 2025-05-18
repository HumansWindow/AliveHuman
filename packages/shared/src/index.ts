/**
 * AliveHuman Shared Package
 * 
 * This package contains shared types, utilities, and configurations used across
 * all packages in the AliveHuman project (backend, frontend, admin, mobile).
 */

// API clients
export * from './api/http';
export * from './api/websocket';

// Blockchain utilities
export * from './blockchain/contracts';
export * from './blockchain/tokens';
export * from './blockchain/wallet';

// Configuration
export * from './config/environment';

// Constants
export * from './constants/api';
export * from './constants/app';

// Hooks (for React applications)
export * from './hooks';

// Internationalization
export * from './i18n';

// Models/Types
export * from './models/auth';
export * from './models/diary';
export * from './models/game';
export * from './models/responses';
export * from './models/user';

// Utilities
export * from './utils/date';
export * from './utils/formatting';
export * from './utils/storage';
export * from './utils/validation';