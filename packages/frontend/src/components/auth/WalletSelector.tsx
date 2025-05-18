import React, { useState, useEffect, useCallback } from 'react';
import { 
  WalletProvider as WalletProviderType,
  WalletAccount,
  WalletSelectorState
} from '@alive-human/shared';
import { isPolygonNetwork, getPolygonNetworkParams, PolygonChainId } from '@alive-human/shared';
import styles from './WalletSelector.module.css';

interface WalletSelectorProps {
  onConnect: (account: WalletAccount) => void;
  onCancel: () => void;
  requirePolygon?: boolean; // Whether to require Polygon network connection
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ 
  onConnect, 
  onCancel,
  requirePolygon = true 
}) => {
  const [providers, setProviders] = useState<WalletProviderType[]>([]);
  const [state, setState] = useState<WalletSelectorState>({
    selectedWallet: null,
    accounts: [],
    connected: false,
    chainId: '',
    networkId: '',
    isPolygonNetwork: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet providers on component mount
  useEffect(() => {
    initializeProviders();
  }, []);

  // Initialize available wallet providers
  const initializeProviders = useCallback(async () => {
    // Check for MetaMask
    const isMetaMaskInstalled = 
      typeof window.ethereum !== 'undefined' && 
      window.ethereum.isMetaMask;
    
    // Check for Coinbase Wallet
    const isCoinbaseInstalled = 
      typeof window.ethereum !== 'undefined' && 
      window.ethereum.isCoinbaseWallet;
    
    // Check for WalletConnect (always supported as it's web-based)
    const isWalletConnectSupported = true;
    
    const walletProviders: WalletProviderType[] = [
      {
        id: 'metamask',
        name: 'MetaMask',
        icon: '/assets/wallets/metamask.svg',
        description: 'Connect to your MetaMask Wallet',
        installed: isMetaMaskInstalled,
        supported: true,
        supportsPolygon: true
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: '/assets/wallets/coinbase.svg',
        description: 'Connect to your Coinbase Wallet',
        installed: isCoinbaseInstalled,
        supported: true,
        supportsPolygon: true
      },
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        icon: '/assets/wallets/walletconnect.svg',
        description: 'Scan with WalletConnect to connect',
        installed: true, // Web-based, always available
        supported: isWalletConnectSupported,
        supportsPolygon: true
      }
    ];
    
    setProviders(walletProviders);
  }, []);

  // Connect to selected wallet
  const connectWallet = async (providerId: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }
      
      if (!provider.supported) {
        throw new Error(`Provider ${provider.name} is not supported in this browser`);
      }
      
      if (requirePolygon && !provider.supportsPolygon) {
        throw new Error(`${provider.name} does not support Polygon network`);
      }
      
      let accounts: string[] = [];
      let chainId: string = '';
      
      switch (providerId) {
        case 'metamask':
        case 'coinbase':
          if (window.ethereum) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            // Check if connected to Polygon network
            const isPolygon = isPolygonNetwork(chainId);
            
            // If not on Polygon and we require it, prompt to switch
            if (requirePolygon && !isPolygon) {
              await switchToPolygonNetwork();
              chainId = await window.ethereum.request({ method: 'eth_chainId' });
            }
          } else {
            throw new Error(`${provider.name} is not installed`);
          }
          break;
        
        case 'walletconnect':
          // WalletConnect implementation will be added later
          throw new Error('WalletConnect implementation coming soon');
          break;
        
        default:
          throw new Error(`Unsupported wallet provider: ${providerId}`);
      }
      
      if (accounts.length > 0) {
        // Get account balances and other details
        const walletAccounts = await Promise.all(
          accounts.map(async (address) => {
            // Get balance logic depends on the blockchain
            let balance = '0';
            
            try {
              // For Ethereum/Polygon balance
              const balanceHex = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
              });
              balance = parseInt(balanceHex, 16).toString();
            } catch (err) {
              console.error('Error fetching balance:', err);
            }
            
            const account: WalletAccount = {
              address,
              publicKey: address,
              balance,
              provider: providerId,
              chainId: chainId,
              networkName: getNetworkNameFromChainId(chainId)
            };
            
            return account;
          })
        );
        
        // Update state
        const isPolygonChain = isPolygonNetwork(chainId);
        setState({
          selectedWallet: providerId,
          accounts: walletAccounts,
          connected: true,
          chainId,
          networkId: getNetworkIdFromChainId(chainId),
          isPolygonNetwork: isPolygonChain
        });
        
        // Cache selected wallet
        localStorage.setItem('selectedWallet', providerId);
        
        // Call onConnect callback with the connected account
        if (walletAccounts.length > 0) {
          onConnect(walletAccounts[0]);
        }
      } else {
        throw new Error('No accounts found. Please check your wallet and try again.');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to Polygon network
  const switchToPolygonNetwork = async (): Promise<boolean> => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found');
    }
    
    // Use testnet for development, mainnet for production
    const isProduction = process.env.NODE_ENV === 'production';
    const targetChainId = isProduction ? PolygonChainId.MAINNET : PolygonChainId.MUMBAI;
    const networkName = isProduction ? 'Polygon Mainnet' : 'Polygon Mumbai Testnet';
    
    try {
      // Try to switch to Polygon network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          const polygonParams = getPolygonNetworkParams(isProduction);
          
          await window.ethereum.request({
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
  };

  // Get network name from chain ID
  const getNetworkNameFromChainId = (chainId: string): string => {
    const chainIdNum = parseInt(chainId, 16);
    
    switch (chainIdNum) {
      case 1:
        return 'Ethereum Mainnet';
      case 3:
        return 'Ropsten Testnet';
      case 4:
        return 'Rinkeby Testnet';
      case 5:
        return 'Goerli Testnet';
      case 42:
        return 'Kovan Testnet';
      case 56:
        return 'Binance Smart Chain';
      case 97:
        return 'BSC Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Polygon Mumbai';
      default:
        return `Unknown (${chainIdNum})`;
    }
  };

  // Get network ID from chain ID
  const getNetworkIdFromChainId = (chainId: string): string => {
    const chainIdNum = parseInt(chainId, 16);
    
    switch (chainIdNum) {
      case 1:
        return 'ethereum:mainnet';
      case 3:
        return 'ethereum:ropsten';
      case 4:
        return 'ethereum:rinkeby';
      case 5:
        return 'ethereum:goerli';
      case 42:
        return 'ethereum:kovan';
      case 56:
        return 'binance:mainnet';
      case 97:
        return 'binance:testnet';
      case 137:
        return 'polygon:mainnet';
      case 80001:
        return 'polygon:mumbai';
      default:
        return `unknown:${chainIdNum}`;
    }
  };

  // Filter providers based on Polygon support if required
  const filteredProviders = requirePolygon
    ? providers.filter(p => p.supportsPolygon)
    : providers;

  return (
    <div className={styles.walletSelector}>
      <div className={styles.header}>
        <h2>Connect Your Wallet</h2>
        <p className={styles.subtitle}>
          {requirePolygon 
            ? 'Select a wallet provider that supports Polygon network'
            : 'Select a wallet provider to continue'
          }
        </p>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <div className={styles.providerList}>
        {filteredProviders.map(provider => (
          <button
            key={provider.id}
            className={styles.providerButton}
            onClick={() => connectWallet(provider.id)}
            disabled={isConnecting || !provider.installed || !provider.supported}
          >
            <img 
              src={provider.icon} 
              alt={provider.name} 
              className={styles.providerIcon} 
            />
            <div className={styles.providerInfo}>
              <h3>{provider.name}</h3>
              <p>{provider.description}</p>
              {!provider.installed && <span className={styles.notInstalled}>Not installed</span>}
            </div>
          </button>
        ))}
      </div>
      
      {isConnecting && (
        <div className={styles.connecting}>
          <div className={styles.spinner}></div>
          <p>Connecting to wallet...</p>
        </div>
      )}
      
      <div className={styles.footer}>
        <button 
          className={styles.cancelButton} 
          onClick={onCancel}
          disabled={isConnecting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WalletSelector;
