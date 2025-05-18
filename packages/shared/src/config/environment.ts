/**
 * Environment configuration utilities
 * 
 * This module provides consistent access to environment variables
 * across different environments (browser, Node.js, React Native).
 */

// Define the shape of our environment variables
export interface Environment {
  // API configuration
  API_URL: string;
  WS_URL: string;
  
  // Environment information
  NODE_ENV: 'development' | 'test' | 'production';
  APP_ENV: 'local' | 'development' | 'staging' | 'production';
  
  // Feature flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_WALLET_FEATURES: boolean;
  ENABLE_GAME_FEATURES: boolean;
  
  // Blockchain configuration
  BLOCKCHAIN_NETWORK: 'mumbai' | 'polygon';
  CONTRACT_ADDRESSES: {
    TOKEN: string;
    NFT: string;
    MARKETPLACE: string;
  };
  
  // Authentication
  AUTH_TOKEN_EXPIRY: number;
  REFRESH_TOKEN_EXPIRY: number;
}

// Default environment values
const defaultEnv: Environment = {
  API_URL: 'http://localhost:3001',
  WS_URL: 'ws://localhost:3001',
  
  NODE_ENV: 'development',
  APP_ENV: 'local',
  
  ENABLE_ANALYTICS: false,
  ENABLE_WALLET_FEATURES: true,
  ENABLE_GAME_FEATURES: true,
  
  BLOCKCHAIN_NETWORK: 'mumbai',
  CONTRACT_ADDRESSES: {
    TOKEN: '0x0000000000000000000000000000000000000000',
    NFT: '0x0000000000000000000000000000000000000000',
    MARKETPLACE: '0x0000000000000000000000000000000000000000',
  },
  
  AUTH_TOKEN_EXPIRY: 60 * 60, // 1 hour in seconds
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60, // 30 days in seconds
};

/**
 * Get environment variables with typed access
 * Works in both browser and Node.js environments
 */
export function getEnvironment(): Environment {
  // Start with default values
  const env = { ...defaultEnv };
  
  // Browser environment
  if (typeof window !== 'undefined') {
    // Get environment variables from window.env (injected at build time or runtime)
    const windowEnv = (window as any).env || {};
    
    // Override defaults with window.env values
    Object.keys(env).forEach((key) => {
      if (windowEnv[key] !== undefined) {
        if (typeof env[key as keyof Environment] === 'boolean') {
          // Convert string to boolean for boolean values
          (env as any)[key] = windowEnv[key] === 'true' || windowEnv[key] === true;
        } else if (typeof env[key as keyof Environment] === 'number') {
          // Convert string to number for number values
          (env as any)[key] = Number(windowEnv[key]);
        } else if (typeof env[key as keyof Environment] === 'object') {
          // Handle nested objects
          try {
            (env as any)[key] = typeof windowEnv[key] === 'string' 
              ? JSON.parse(windowEnv[key]) 
              : windowEnv[key];
          } catch (e) {
            console.error(`Failed to parse ${key} environment variable:`, e);
          }
        } else {
          // Use the value as is for strings and other types
          (env as any)[key] = windowEnv[key];
        }
      }
    });
  } 
  // Node.js environment
  else if (typeof process !== 'undefined' && process.env) {
    // Override defaults with process.env values
    
    // API configuration
    if (process.env.API_URL) env.API_URL = process.env.API_URL;
    if (process.env.WS_URL) env.WS_URL = process.env.WS_URL;
    
    // Environment information
    if (process.env.NODE_ENV) {
      env.NODE_ENV = process.env.NODE_ENV as Environment['NODE_ENV'];
    }
    if (process.env.APP_ENV) {
      env.APP_ENV = process.env.APP_ENV as Environment['APP_ENV'];
    }
    
    // Feature flags
    if (process.env.ENABLE_ANALYTICS !== undefined) {
      env.ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS === 'true';
    }
    if (process.env.ENABLE_WALLET_FEATURES !== undefined) {
      env.ENABLE_WALLET_FEATURES = process.env.ENABLE_WALLET_FEATURES === 'true';
    }
    if (process.env.ENABLE_GAME_FEATURES !== undefined) {
      env.ENABLE_GAME_FEATURES = process.env.ENABLE_GAME_FEATURES === 'true';
    }
    
    // Blockchain configuration
    if (process.env.BLOCKCHAIN_NETWORK) {
      env.BLOCKCHAIN_NETWORK = process.env.BLOCKCHAIN_NETWORK as Environment['BLOCKCHAIN_NETWORK'];
    }
    if (process.env.CONTRACT_ADDRESSES) {
      try {
        env.CONTRACT_ADDRESSES = JSON.parse(process.env.CONTRACT_ADDRESSES);
      } catch (e) {
        console.error('Failed to parse CONTRACT_ADDRESSES environment variable:', e);
      }
    } else {
      // Handle individual contract address env vars
      const contractAddresses: Record<string, string> = {};
      if (process.env.TOKEN_CONTRACT_ADDRESS) {
        contractAddresses.TOKEN = process.env.TOKEN_CONTRACT_ADDRESS;
      }
      if (process.env.NFT_CONTRACT_ADDRESS) {
        contractAddresses.NFT = process.env.NFT_CONTRACT_ADDRESS;
      }
      if (process.env.MARKETPLACE_CONTRACT_ADDRESS) {
        contractAddresses.MARKETPLACE = process.env.MARKETPLACE_CONTRACT_ADDRESS;
      }
      
      if (Object.keys(contractAddresses).length > 0) {
        env.CONTRACT_ADDRESSES = {
          ...env.CONTRACT_ADDRESSES,
          ...contractAddresses,
        };
      }
    }
    
    // Authentication
    if (process.env.AUTH_TOKEN_EXPIRY) {
      env.AUTH_TOKEN_EXPIRY = parseInt(process.env.AUTH_TOKEN_EXPIRY, 10);
    }
    if (process.env.REFRESH_TOKEN_EXPIRY) {
      env.REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY, 10);
    }
  }
  
  return env;
}

// Create and export a singleton instance
export const env = getEnvironment();