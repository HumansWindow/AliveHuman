/**
 * Web3 authentication related models and interfaces
 */

/**
 * Device fingerprinting information
 */
export interface DeviceFingerprint {
  hardwareId: string;      // Unique hardware identifier
  browserInfo: {
    name: string;
    version: string;
    language: string;
    userAgent: string;
    platform: string;
  };
  screenResolution: {
    width: number;
    height: number;
    colorDepth: number;
  };
  installedFonts: string[];
  installedPlugins: string[];
  timezone: string;
  canvas: string;           // Canvas fingerprint
  webglFingerprint: string; // WebGL capabilities fingerprint
}

/**
 * User location data
 */
export interface LocationData {
  ip: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  country: string;
  region: string;
  city: string;
  isp: string;
  timezone: string;
  timestamp: number;
}

/**
 * User session information
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  walletAddress: string;
  deviceFingerprint: DeviceFingerprint;
  locationData: LocationData;
  startTime: number;
  lastActiveTime: number;
  isActive: boolean;
  authToken: string;
  refreshToken: string;
  chainId?: string;
}

/**
 * Wallet provider information
 */
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed: boolean;
  supported: boolean;
  supportsPolygon: boolean; // Indicates if wallet supports Polygon network
}

/**
 * Wallet account information
 */
export interface WalletAccount {
  address: string;
  publicKey: string;
  balance: string;
  provider: string;
  chainId: string;
  networkName: string;
}

/**
 * Wallet selector state
 */
export interface WalletSelectorState {
  selectedWallet: string | null;
  accounts: WalletAccount[];
  connected: boolean;
  chainId: string;
  networkId: string;
  isPolygonNetwork: boolean; // Flag to indicate if connected to Polygon
}

/**
 * Web3 authentication request DTO
 */
export interface Web3AuthDto {
  walletAddress: string;
  signature: string;
  nonce: string;
  deviceFingerprint: DeviceFingerprint;
  locationData: LocationData;
  chainId: string;
}

/**
 * Session heartbeat DTO
 */
export interface SessionHeartbeatDto {
  sessionId: string;
  lastActiveTime: number;
  locationData: LocationData;
}

/**
 * Refresh token DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
  deviceFingerprint: DeviceFingerprint;
  locationData: LocationData;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    walletAddress: string;
    chainId: string;
  };
  session: {
    id: string;
    startTime: Date | number;
  };
}
