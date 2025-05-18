import React, { useState } from 'react';
import { WalletAccount } from '@alive-human/shared';
import WalletSelector from './WalletSelector';
import useWeb3Auth from '../../hooks/auth/useWeb3Auth';
import styles from './Web3Login.module.css';

interface Web3LoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  requirePolygon?: boolean;
}

const Web3Login: React.FC<Web3LoginProps> = ({ 
  onSuccess, 
  onCancel,
  requirePolygon = true
}) => {
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { isAuthenticated, isAuthenticating, user, error, login } = useWeb3Auth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle wallet connection
  const handleWalletConnect = async (account: WalletAccount) => {
    setAuthError(null);
    try {
      const success = await login(account);
      if (success) {
        setShowWalletSelector(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setAuthError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Authentication failed');
    }
  };

  // Handle wallet selection cancellation
  const handleCancel = () => {
    setShowWalletSelector(false);
    if (onCancel) {
      onCancel();
    }
  };

  // Show wallet connect button if not authenticated
  if (!isAuthenticated && !showWalletSelector) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Connect with Web3</h2>
        <p className={styles.description}>
          {requirePolygon 
            ? 'Connect your Polygon-compatible wallet to continue' 
            : 'Connect your wallet to continue'
          }
        </p>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <button 
          className={styles.connectButton}
          onClick={() => setShowWalletSelector(true)}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Show wallet selector if requested
  if (showWalletSelector) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <WalletSelector 
            onConnect={handleWalletConnect} 
            onCancel={handleCancel}
            requirePolygon={requirePolygon}
          />
          
          {authError && (
            <div className={styles.authError}>
              {authError}
            </div>
          )}
          
          {isAuthenticating && (
            <div className={styles.authenticating}>
              <div className={styles.spinner}></div>
              <p>Authenticating...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show connected state if authenticated
  return (
    <div className={styles.container}>
      <div className={styles.connectedStatus}>
        <div className={styles.connectionDot}></div>
        <span>Connected to Wallet</span>
      </div>
      
      {user && (
        <div className={styles.accountInfo}>
          <p className={styles.address}>
            {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)}
          </p>
          <p className={styles.network}>
            {user.chainId === '0x89' ? 'Polygon Mainnet' : 
              user.chainId === '0x13881' ? 'Polygon Mumbai' : 
              'Unknown Network'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Web3Login;
