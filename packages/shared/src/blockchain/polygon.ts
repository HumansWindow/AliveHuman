/**
 * Polygon network utilities
 */
import { NETWORKS } from '../constants/app';

/**
 * Polygon network chain IDs
 */
export enum PolygonChainId {
  MAINNET = '0x89', // 137 in decimal
  MUMBAI = '0x13881', // 80001 in decimal
}

/**
 * Check if a network is a Polygon network
 * @param chainId The chain ID to check (hex string with 0x prefix)
 * @returns boolean indicating if the network is Polygon
 */
export function isPolygonNetwork(chainId: string): boolean {
  return chainId === PolygonChainId.MAINNET || chainId === PolygonChainId.MUMBAI;
}

/**
 * Get Polygon network name from chain ID
 * @param chainId The Polygon chain ID
 * @returns The human-readable Polygon network name
 */
export function getPolygonNetworkName(chainId: string): string {
  switch (chainId) {
    case PolygonChainId.MAINNET:
      return 'Polygon Mainnet';
    case PolygonChainId.MUMBAI:
      return 'Polygon Mumbai Testnet';
    default:
      return 'Unknown Polygon Network';
  }
}

/**
 * Get Polygon network parameters for adding to wallet
 * @param isProduction Whether to use mainnet or testnet
 * @returns Network parameters for wallet_addEthereumChain method
 */
export function getPolygonNetworkParams(isProduction: boolean): any {
  return isProduction 
    ? {
        chainId: PolygonChainId.MAINNET,
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      }
    : {
        chainId: PolygonChainId.MUMBAI,
        chainName: 'Polygon Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
      };
}

/**
 * Switch wallet to Polygon network
 * @param ethereum The window.ethereum provider
 * @param isProduction Whether to use mainnet or testnet
 * @returns Promise resolving to boolean indicating success
 */
export async function switchToPolygonNetwork(ethereum: any, isProduction: boolean): Promise<boolean> {
  if (!ethereum) {
    throw new Error('No Ethereum provider found');
  }
  
  const targetChainId = isProduction ? PolygonChainId.MAINNET : PolygonChainId.MUMBAI;
  const networkName = isProduction ? 'Polygon Mainnet' : 'Polygon Mumbai Testnet';
  
  try {
    // Try to switch to Polygon network
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to the wallet
    if (switchError.code === 4902) {
      try {
        const polygonParams = getPolygonNetworkParams(isProduction);
        
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [polygonParams],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Polygon network', addError);
        throw new Error(`Failed to add ${networkName}`);
      }
    }
    console.error('Error switching to Polygon network', switchError);
    throw new Error(`Failed to switch to ${networkName}`);
  }
}
