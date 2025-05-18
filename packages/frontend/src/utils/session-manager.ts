/**
 * Session management for Web3 authentication
 */
import { 
  UserSession, 
  DeviceFingerprint, 
  LocationData,
  RefreshTokenDto
} from '@alive-human/shared';
import { generateDeviceFingerprint } from './fingerprint';
import { getUserLocation, getFallbackLocation } from './geolocation';
import { api } from '../api/http';

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private sessionHeartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 60000; // 1 minute
  
  private constructor() {
    // Initialize session from localStorage if exists
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      this.currentSession = JSON.parse(savedSession);
      this.startSessionHeartbeat();
    }
    
    // Listen for window focus/blur events
    window.addEventListener('focus', this.updateLastActiveTime.bind(this));
    window.addEventListener('blur', this.updateLastActiveTime.bind(this));
  }
  
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  /**
   * Create a new user session after successful authentication
   */
  public async createNewSession(userId: string, walletAddress: string): Promise<UserSession> {
    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      
      // Try to get geolocation, but handle permission denial
      let locationData: LocationData | Partial<LocationData>;
      try {
        locationData = await getUserLocation();
      } catch (error) {
        console.warn('Geolocation permission denied, using fallback location');
        const fallbackLocation = await getFallbackLocation();
        locationData = {
          ...fallbackLocation,
          coordinates: {
            latitude: 0,
            longitude: 0,
            accuracy: 0
          }
        } as LocationData;
      }
      
      // Generate session ID using crypto API
      const sessionId = crypto.randomUUID();
      
      const session: UserSession = {
        sessionId,
        userId,
        walletAddress,
        deviceFingerprint,
        locationData: locationData as LocationData,
        startTime: Date.now(),
        lastActiveTime: Date.now(),
        isActive: true,
        authToken: '', // Will be filled by auth service
        refreshToken: '' // Will be filled by auth service
      };
      
      // Save session
      this.currentSession = session;
      localStorage.setItem('userSession', JSON.stringify(session));
      
      // Start heartbeat
      this.startSessionHeartbeat();
      
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user session
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }
  
  /**
   * Update the last active time for the session
   */
  public updateLastActiveTime(): void {
    if (this.currentSession) {
      this.currentSession.lastActiveTime = Date.now();
      localStorage.setItem('userSession', JSON.stringify(this.currentSession));
    }
  }
  
  /**
   * Update session tokens after authentication or token refresh
   */
  public updateSessionTokens(authToken: string, refreshToken: string): void {
    if (this.currentSession) {
      this.currentSession.authToken = authToken;
      this.currentSession.refreshToken = refreshToken;
      localStorage.setItem('userSession', JSON.stringify(this.currentSession));
    }
  }
  
  /**
   * End the current session and log the user out
   */
  public async endSession(): Promise<void> {
    if (this.sessionHeartbeatInterval) {
      clearInterval(this.sessionHeartbeatInterval);
      this.sessionHeartbeatInterval = null;
    }
    
    if (this.currentSession) {
      this.currentSession.isActive = false;
      
      try {
        // Send end session to backend
        await api.post('/auth/web3/end-session', {
          sessionId: this.currentSession.sessionId
        }, {
          headers: {
            'Authorization': `Bearer ${this.currentSession.authToken}`
          }
        });
      } catch (error) {
        console.error('Error ending session:', error);
      }
      
      // Clear local storage
      localStorage.removeItem('userSession');
      this.currentSession = null;
    }
  }
  
  /**
   * Refresh the authentication token
   */
  public async refreshToken(): Promise<boolean> {
    if (!this.currentSession?.refreshToken) {
      return false;
    }
    
    try {
      // Get updated device and location information
      const deviceFingerprint = await generateDeviceFingerprint();
      
      let locationData: LocationData;
      try {
        locationData = await getUserLocation();
      } catch (error) {
        console.warn('Geolocation permission denied, using fallback location');
        const fallbackLocation = await getFallbackLocation();
        locationData = {
          ...fallbackLocation,
          coordinates: {
            latitude: 0,
            longitude: 0,
            accuracy: 0
          }
        } as LocationData;
      }
      
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: this.currentSession.refreshToken,
        deviceFingerprint,
        locationData
      };
      
      const response = await api.post('/auth/web3/refresh-token', refreshTokenDto);
      
      if (response.data) {
        this.updateSessionTokens(
          response.data.accessToken,
          response.data.refreshToken
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.endSession(); // End session on refresh failure
      return false;
    }
  }
  
  /**
   * Start the session heartbeat interval
   */
  private startSessionHeartbeat(): void {
    if (this.sessionHeartbeatInterval) {
      clearInterval(this.sessionHeartbeatInterval);
    }
    
    this.sessionHeartbeatInterval = setInterval(async () => {
      if (this.currentSession && this.currentSession.isActive) {
        try {
          // Update location data
          let locationData: LocationData;
          try {
            locationData = await getUserLocation();
          } catch (error) {
            // If geolocation is denied, use the existing location data
            locationData = this.currentSession.locationData;
            locationData.timestamp = Date.now();
          }
          
          // Send heartbeat to backend
          const response = await api.post('/auth/web3/session-heartbeat', {
            sessionId: this.currentSession.sessionId,
            lastActiveTime: Date.now(),
            locationData
          }, {
            headers: {
              'Authorization': `Bearer ${this.currentSession.authToken}`
            }
          });
          
          if (!response.data.success) {
            throw new Error('Session heartbeat failed');
          }
          
          // Update session data
          this.currentSession.lastActiveTime = Date.now();
          this.currentSession.locationData = locationData;
          localStorage.setItem('userSession', JSON.stringify(this.currentSession));
        } catch (error) {
          console.error('Session heartbeat error:', error);
          
          // If session is invalid, try to refresh the token
          if (error.response && error.response.status === 401) {
            const refreshed = await this.refreshToken();
            if (!refreshed) {
              this.endSession();
            }
          }
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }
}
