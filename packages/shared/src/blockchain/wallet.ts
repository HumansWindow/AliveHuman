/**
 * Wallet integration utilities for blockchain interactions
 */

import { NETWORKS } from '../constants/app';

/**
 * Types of wallet providers supported by the application
 */
export enum WalletProvider {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'walletconnect',
  COINBASE = 'coinbase',
  WEB3AUTH = 'web3auth',
}

/**
 * Wallet connection status
 */
export enum WalletConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Wallet account information
 */
export interface WalletAccount {
  address: string;
  balance?: string;
  networkId?: number;
  networkName?: string;
}

/**
 * Wallet connection result
 */
export interface WalletConnectionResult {
  success: boolean;
  account?: WalletAccount;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Network switching result
 */
export interface NetworkSwitchResult {
  success: boolean;
  networkId?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Transaction request parameters
 */
export interface TransactionRequest {
  to: string;
  from?: string;
  value?: string; // in wei
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  hash?: string;
  receipt?: any;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Signature request parameters
 */
export interface SignatureRequest {
  message: string;
  address: string;
}

/**
 * Signature result
 */
export interface SignatureResult {
  success: boolean;
  signature?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Check if the Ethereum provider is available in the browser
 */
export function isEthereumProviderAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as any).ethereum !== 'undefined';
}

/**
 * Format an Ethereum address for display
 * @param address Full Ethereum address
 * @param prefixLength Number of characters to show at start
 * @param suffixLength Number of characters to show at end
 */
export function formatAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address) return '';
  
  // Ensure the address has the correct format
  if (!address.startsWith('0x') || address.length !== 42) {
    return address;
  }
  
  const prefix = address.slice(0, prefixLength + 2); // +2 for '0x'
  const suffix = address.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
}

/**
 * Format token amount for display
 * @param amount Raw token amount (in wei/smallest unit)
 * @param decimals Number of decimals the token has
 * @param displayDecimals Number of decimals to display
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  if (!amount) return '0';
  
  // Convert to number and divide by 10^decimals
  const value = Number(amount) / Math.pow(10, decimals);
  
  // Format with correct number of decimal places
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

/**
 * Get required network details by chain ID
 * @param chainId Blockchain network chain ID
 */
export function getNetworkByChainId(chainId: number): any {
  // Find the network in our configured networks
  const network = Object.values(NETWORKS).find(
    network => network.chainId === chainId
  );
  
  return network;
}

/**
 * Check if a chain ID is supported by the application
 * @param chainId Blockchain network chain ID
 */
export function isSupportedNetwork(chainId: number): boolean {
  return !!getNetworkByChainId(chainId);
}