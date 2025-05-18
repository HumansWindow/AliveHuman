import { useState, useEffect, useCallback } from 'react';
import { 
  WalletAccount,
  Web3AuthDto,
  AuthResponse
} from '@alive-human/shared';
import { api } from '../../api/http';
import { SessionManager } from '../../utils/session-manager';
import { generateDeviceFingerprint } from '../../utils/fingerprint';
import { getUserLocation, getFallbackLocation } from '../../utils/geolocation';

interface UseWeb3AuthResult {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  user: {
    id: string;
    walletAddress: string;
    chainId: string;
  } | null;
  error: string | null;
  login: (account: WalletAccount) => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * Hook for Web3 authentication
 */
export function useWeb3Auth(): UseWeb3AuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [user, setUser] = useState<{ 
    id: string; 
    walletAddress: string; 
    chainId: string; 
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionManager = SessionManager.getInstance();

  // Check for existing session on mount
  useEffect(() => {
    const currentSession = sessionManager.getCurrentSession();
    if (currentSession && currentSession.isActive) {
      setIsAuthenticated(true);
      setUser({
        id: currentSession.userId,
        walletAddress: currentSession.walletAddress,
        chainId: currentSession.chainId || ''
      });
    }
  }, []);

  /**
   * Login with wallet
   * @param account The wallet account to authenticate with
   */
  const login = useCallback(async (account: WalletAccount): Promise<boolean> => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Step 1: Get challenge from server
      const challengeResponse = await api.get('/auth/web3/challenge');
      const { message, nonce } = challengeResponse.data;

      // Step 2: Request signature from wallet
      let signature: string;
      
      try {
        // Request personal signature (eth_sign)
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, account.address]
        });
      } catch (signError: any) {
        console.error('Signature request error:', signError);
        setError(`Failed to sign the message: ${signError.message}`);
        setIsAuthenticating(false);
        return false;
      }

      // Step 3: Get device fingerprint and location
      const deviceFingerprint = await generateDeviceFingerprint();
      
      let locationData;
      try {
        locationData = await getUserLocation();
      } catch (locationError) {
        console.warn('Geolocation permission denied, using fallback location');
        const fallbackLocation = await getFallbackLocation();
        locationData = {
          ...fallbackLocation,
          coordinates: {
            latitude: 0,
            longitude: 0,
            accuracy: 0
          }
        };
      }

      // Step 4: Authenticate with server
      const authDto: Web3AuthDto = {
        walletAddress: account.address,
        signature,
        nonce,
        deviceFingerprint,
        locationData,
        chainId: account.chainId
      };

      const authResponse = await api.post<AuthResponse>('/auth/web3/authenticate', authDto);
      const { accessToken, refreshToken, user, session } = authResponse.data;

      // Step 5: Create and save session
      const newSession = await sessionManager.createNewSession(user.id, user.walletAddress);
      sessionManager.updateSessionTokens(accessToken, refreshToken);

      // Step 6: Update state
      setUser(user);
      setIsAuthenticated(true);

      return true;
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.response?.data?.message || error.message || 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  /**
   * Logout and end the session
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await sessionManager.endSession();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return {
    isAuthenticated,
    isAuthenticating,
    user,
    error,
    login,
    logout
  };
}

export default useWeb3Auth;
