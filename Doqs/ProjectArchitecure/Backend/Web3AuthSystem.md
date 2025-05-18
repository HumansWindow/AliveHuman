# Web3 Authentication System Architecture

## Overview

The Web3 Authentication System in AliveHuman provides a secure, decentralized authentication mechanism using blockchain wallets. It allows users to authenticate without traditional passwords by using cryptographic signatures, while also incorporating advanced security features like device fingerprinting, geolocation tracking, and IP validation to prevent unauthorized access.

## File Structure

```
packages/backend/src/auth/
├── auth.controller.ts      # Main auth controller
├── auth.module.ts          # Auth module definition
├── auth.service.ts         # Core auth service
├── controllers/            # Authentication controllers
│   ├── auth.controller.ts  # Traditional auth controller
│   ├── wallet-auth.controller.ts # Basic wallet auth
│   └── web3-auth.controller.ts # Web3 authentication controller
├── decorators/             # Custom decorators
│   ├── current-user.decorator.ts # Get current user
│   └── public.decorator.ts # Mark routes as public
├── dto/                    # Data transfer objects
│   ├── auth-response.dto.ts # Auth response structure
│   ├── login.dto.ts        # Login data structure
│   ├── nonce.dto.ts        # Challenge nonce data
│   ├── refresh-token.dto.ts # Token refresh data
│   └── web3-auth.dto.ts    # Web3 auth data structure
├── entities/               # Database entities
│   └── session.entity.ts   # User session entity
├── guards/                 # Route guards
│   ├── jwt-auth.guard.ts   # JWT authentication guard
│   └── roles.guard.ts      # Role-based access control
├── interfaces/             # Interface definitions
│   ├── jwt-payload.interface.ts # JWT payload structure
│   └── session.interface.ts # Session data interface
├── jwt.module.ts           # JWT module configuration
├── modules/                # Auth submodules
├── services/               # Authentication services
│   ├── auth.service.ts     # Traditional auth service
│   └── web3-auth.service.ts # Web3 authentication service
├── strategies/             # Auth strategies
│   └── jwt.strategy.ts     # JWT authentication strategy
└── types/                  # Type definitions
    └── role.enum.ts        # User role definitions
```

## Core Components

### 1. Auth Module

The `auth.module.ts` defines the NestJS module for authentication:

```typescript
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '15m' },
    }),
    TypeOrmModule.forFeature([User, Session]),
    UsersModule,
    WalletsModule,
  ],
  controllers: [
    AuthController,
    WalletAuthController,
    Web3AuthController,
  ],
  providers: [
    AuthService,
    Web3AuthService,
    JwtStrategy,
    ConfigService,
  ],
  exports: [
    AuthService,
    Web3AuthService,
    JwtStrategy,
  ],
})
export class AuthModule {}
```

### 2. Web3 Auth Controller

The `web3-auth.controller.ts` handles wallet authentication requests:

```typescript
@Controller('auth/web3')
export class Web3AuthController {
  constructor(private readonly web3AuthService: Web3AuthService) {}
  
  // Generate a challenge nonce for the user to sign
  @Post('challenge')
  async generateChallenge(
    @Body() nonceDto: NonceDto
  ): Promise<{ nonce: string }> {
    const { walletAddress } = nonceDto;
    const nonce = await this.web3AuthService.generateNonce(walletAddress);
    return { nonce };
  }
  
  // Authenticate using a signed message
  @Post('authenticate')
  async authenticate(
    @Body() authDto: Web3AuthDto,
    @Req() req: Request
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip;
    return await this.web3AuthService.authenticate({
      ...authDto,
      ipAddress,
    });
  }
  
  // Refresh the authentication token
  @Post('refresh-token')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip;
    return await this.web3AuthService.refreshToken({
      ...refreshTokenDto,
      ipAddress,
    });
  }
  
  // Session heartbeat to keep the session active
  @UseGuards(JwtAuthGuard)
  @Post('heartbeat')
  async heartbeat(
    @CurrentUser() user: User,
    @Body() heartbeatDto: HeartbeatDto
  ): Promise<{ success: boolean }> {
    const { deviceFingerprint, locationData } = heartbeatDto;
    
    await this.web3AuthService.updateSessionActivity(
      user.id,
      deviceFingerprint,
      locationData
    );
    
    return { success: true };
  }
  
  // Logout and invalidate the session
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @Body() logoutDto: LogoutDto
  ): Promise<{ success: boolean }> {
    const { refreshToken } = logoutDto;
    
    await this.web3AuthService.logout(user.id, refreshToken);
    
    return { success: true };
  }
}
```

### 3. Web3 Auth Service

The `web3-auth.service.ts` implements wallet-based authentication logic:

```typescript
@Injectable()
export class Web3AuthService {
  private readonly logger = new Logger(Web3AuthService.name);
  
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly walletService: WalletService,
  ) {}
  
  // Generate a random nonce for the user to sign
  async generateNonce(walletAddress: string): Promise<string> {
    // Validate wallet address
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }
    
    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    
    // Get or create user by wallet address
    const user = await this.getUserByWalletAddress(walletAddress);
    
    // Store the nonce and its expiration time
    user.authNonce = nonce;
    user.authNonceExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await this.userRepository.save(user);
    
    return nonce;
  }
  
  // Authenticate a user with a signed message
  async authenticate(authDto: Web3AuthDto & { ipAddress: string }): Promise<AuthResponseDto> {
    const { walletAddress, signature, nonce, deviceFingerprint, locationData, chainId, ipAddress } = authDto;
    
    // Validate wallet address
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }
    
    // Get user by wallet address
    const user = await this.getUserByWalletAddress(walletAddress);
    
    // Verify nonce is valid and not expired
    if (!user.authNonce || user.authNonce !== nonce) {
      throw new UnauthorizedException('Invalid nonce');
    }
    
    if (!user.authNonceExpires || user.authNonceExpires < new Date()) {
      throw new UnauthorizedException('Nonce expired');
    }
    
    // Verify signature
    const isSignatureValid = this.verifyWalletSignature(
      walletAddress,
      this.createSignatureMessage(nonce),
      signature
    );
    
    if (!isSignatureValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    // Clear the used nonce
    user.authNonce = null;
    user.authNonceExpires = null;
    await this.userRepository.save(user);
    
    // Create a session
    const session = await this.createSession(
      user,
      walletAddress,
      deviceFingerprint,
      locationData,
      ipAddress,
      chainId
    );
    
    // Generate JWT tokens
    const tokens = this.generateAuthTokens(user, session);
    
    return {
      user: {
        id: user.id,
        walletAddress,
        email: user.email,
        username: user.username,
        roles: user.roles,
      },
      ...tokens,
      expiresAt: new Date(Date.now() + this.getAccessTokenExpiry() * 1000).toISOString(),
    };
  }
  
  // Refresh the JWT token
  async refreshToken(refreshTokenDto: RefreshTokenDto & { ipAddress: string }): Promise<AuthResponseDto> {
    const { refreshToken, deviceFingerprint, locationData, ipAddress } = refreshTokenDto;
    
    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('auth.refreshTokenSecret'),
      });
      
      // Get the user and session
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        relations: ['sessions'],
      });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Find the session associated with this refresh token
      const session = user.sessions.find(
        s => s.refreshToken === refreshToken && s.isActive
      );
      
      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }
      
      // Verify device fingerprint
      const fingerprintMatch = this.verifyDeviceFingerprint(
        session.deviceFingerprint, 
        deviceFingerprint
      );
      
      if (!fingerprintMatch) {
        throw new UnauthorizedException('Device fingerprint mismatch');
      }
      
      // Verify location data
      const locationValid = this.validateLocationData(
        session.locationData,
        locationData
      );
      
      if (!locationValid) {
        this.logger.warn(`Suspicious location change for user ${user.id}`);
        // Don't block access but flag it
        session.securityFlags = [
          ...(session.securityFlags || []),
          'LOCATION_CHANGE',
        ];
      }
      
      // Update session with new data
      session.ipAddress = ipAddress;
      session.lastActivityAt = new Date();
      
      if (locationData) {
        session.locationData = locationData;
      }
      
      // Generate new tokens
      const tokens = this.generateAuthTokens(user, session);
      
      await this.sessionRepository.save(session);
      
      return {
        user: {
          id: user.id,
          walletAddress: session.walletAddress,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
        ...tokens,
        expiresAt: new Date(Date.now() + this.getAccessTokenExpiry() * 1000).toISOString(),
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  
  // Create a user session
  private async createSession(
    user: User,
    walletAddress: string,
    deviceFingerprint: DeviceFingerprint,
    locationData: LocationData,
    ipAddress: string,
    chainId?: number
  ): Promise<Session> {
    // Check if there's already a session with this device fingerprint
    const existingSession = await this.sessionRepository.findOne({
      where: {
        user: { id: user.id },
        deviceFingerprint: deviceFingerprint as any,
        isActive: true,
      },
    });
    
    if (existingSession) {
      // Update existing session
      existingSession.walletAddress = walletAddress;
      existingSession.ipAddress = ipAddress;
      existingSession.lastActivityAt = new Date();
      existingSession.locationData = locationData;
      existingSession.chainId = chainId;
      
      // Clear refresh token, will be set later
      existingSession.refreshToken = null;
      
      return await this.sessionRepository.save(existingSession);
    }
    
    // Create a new session
    const session = this.sessionRepository.create({
      user,
      walletAddress,
      deviceFingerprint: deviceFingerprint as any,
      locationData,
      ipAddress,
      chainId,
      isActive: true,
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    return await this.sessionRepository.save(session);
  }
  
  // Generate JWT tokens for the user
  private generateAuthTokens(
    user: User,
    session: Session
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username || user.id.substring(0, 8),
      roles: user.roles,
      sessionId: session.id,
    };
    
    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('auth.accessTokenSecret'),
      expiresIn: `${this.getAccessTokenExpiry()}s`,
    });
    
    // Generate refresh token
    const refreshToken = this.jwtService.sign(
      { ...payload, tokenType: 'refresh' },
      {
        secret: this.configService.get<string>('auth.refreshTokenSecret'),
        expiresIn: '30d', // 30 days
      }
    );
    
    // Store refresh token in session
    session.refreshToken = refreshToken;
    this.sessionRepository.save(session);
    
    return { accessToken, refreshToken };
  }
  
  // Update session activity timestamp
  async updateSessionActivity(
    userId: string,
    deviceFingerprint: DeviceFingerprint,
    locationData?: LocationData
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: {
        user: { id: userId },
        deviceFingerprint: deviceFingerprint as any,
        isActive: true,
      },
    });
    
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    
    session.lastActivityAt = new Date();
    
    if (locationData) {
      // Validate location data
      const locationValid = this.validateLocationData(
        session.locationData,
        locationData
      );
      
      if (!locationValid) {
        this.logger.warn(`Suspicious location change for user ${userId}`);
        session.securityFlags = [
          ...(session.securityFlags || []),
          'LOCATION_CHANGE',
        ];
      }
      
      session.locationData = locationData;
    }
    
    await this.sessionRepository.save(session);
  }
  
  // Logout and invalidate session
  async logout(userId: string, refreshToken: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: {
        user: { id: userId },
        refreshToken,
        isActive: true,
      },
    });
    
    if (!session) {
      return; // No active session with this refresh token
    }
    
    session.isActive = false;
    session.refreshToken = null;
    session.invalidatedAt = new Date();
    
    await this.sessionRepository.save(session);
  }
  
  // Get or create user by wallet address
  private async getUserByWalletAddress(walletAddress: string): Promise<User> {
    // Check if the wallet is already associated with a user
    const wallet = await this.walletService.findByAddress(walletAddress);
    
    if (wallet) {
      return wallet.user;
    }
    
    // No user found with this wallet address, create a new one
    const user = this.userRepository.create({
      username: `user_${walletAddress.substring(2, 8)}`,
      roles: [Role.USER],
    });
    
    const savedUser = await this.userRepository.save(user);
    
    // Create wallet connection
    await this.walletService.createWalletConnection(savedUser.id, walletAddress);
    
    return savedUser;
  }
  
  // Create a message for the user to sign
  private createSignatureMessage(nonce: string): string {
    return `Welcome to AliveHuman!\n\nPlease sign this message to authenticate.\n\nNonce: ${nonce}\n\nThis signature will not trigger a blockchain transaction or cost any gas fees.`;
  }
  
  // Verify wallet signature
  private verifyWalletSignature(
    address: string,
    message: string,
    signature: string
  ): boolean {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }
  
  // Verify device fingerprint
  private verifyDeviceFingerprint(
    storedFingerprint: DeviceFingerprint, 
    currentFingerprint: DeviceFingerprint
  ): boolean {
    // Compare hardware ID (most important)
    if (storedFingerprint.hardwareId !== currentFingerprint.hardwareId) {
      this.logger.warn(`Device hardware ID mismatch: ${storedFingerprint.hardwareId} vs ${currentFingerprint.hardwareId}`);
      return false;
    }
    
    // Compare browser info
    if (storedFingerprint.browserInfo.name !== currentFingerprint.browserInfo.name) {
      this.logger.warn(`Browser name mismatch: ${storedFingerprint.browserInfo.name} vs ${currentFingerprint.browserInfo.name}`);
      // Don't reject just for browser change, but log it
    }
    
    // Could add more checks based on fingerprint data
    
    return true;
  }
  
  // Validate location data change
  private validateLocationData(
    storedLocation: LocationData,
    currentLocation: LocationData
  ): boolean {
    if (!storedLocation || !currentLocation) {
      return true; // Can't validate
    }
    
    // Check if IP has changed dramatically
    if (storedLocation.ip !== currentLocation.ip) {
      // IP change could be legitimate (mobile networks, VPNs, etc.)
      // but we should log it
      this.logger.log(`IP change detected: ${storedLocation.ip} to ${currentLocation.ip}`);
    }
    
    // If we have coordinates, check for significant location changes
    if (
      storedLocation.coordinates && 
      currentLocation.coordinates
    ) {
      const distance = this.calculateDistance(
        storedLocation.coordinates.latitude,
        storedLocation.coordinates.longitude,
        currentLocation.coordinates.latitude,
        currentLocation.coordinates.longitude
      );
      
      // If distance > 500 km and happened within short time, flag as suspicious
      const suspiciousDistance = 500; // km
      
      if (distance > suspiciousDistance) {
        this.logger.warn(`Suspicious location change detected: ${distance} km`);
        return false;
      }
    }
    
    return true;
  }
  
  // Calculate distance between coordinates (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  // Get access token expiry time in seconds
  private getAccessTokenExpiry(): number {
    return parseInt(
      this.configService.get<string>('auth.accessTokenExpirySeconds', '900'),
      10
    );
  }
}
```

### 4. JWT Strategy

The `jwt.strategy.ts` implements the Passport.js JWT strategy:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.accessTokenSecret'),
      passReqToCallback: true,
    });
  }
  
  async validate(req: Request, payload: JwtPayload): Promise<User> {
    // Verify the session exists and is active
    const session = await this.sessionRepository.findOne({
      where: {
        id: payload.sessionId,
        isActive: true,
      },
      relations: ['user'],
    });
    
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    
    // Check if session has expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      session.isActive = false;
      await this.sessionRepository.save(session);
      throw new UnauthorizedException('Session expired');
    }
    
    // Update last activity timestamp
    session.lastActivityAt = new Date();
    await this.sessionRepository.save(session);
    
    return session.user;
  }
}
```

### 5. Current User Decorator

The `current-user.decorator.ts` provides easy access to the authenticated user:

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 6. Session Entity

The `session.entity.ts` defines the user session data structure:

```typescript
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() => User, user => user.sessions)
  user: User;
  
  @Column()
  walletAddress: string;
  
  @Column({ nullable: true })
  refreshToken: string;
  
  @Column({ type: 'jsonb' })
  deviceFingerprint: DeviceFingerprint;
  
  @Column({ type: 'jsonb', nullable: true })
  locationData: LocationData;
  
  @Column()
  ipAddress: string;
  
  @Column({ nullable: true })
  chainId: number;
  
  @Column({ default: true })
  isActive: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column()
  lastActivityAt: Date;
  
  @Column({ nullable: true })
  expiresAt: Date;
  
  @Column({ nullable: true })
  invalidatedAt: Date;
  
  @Column('simple-array', { nullable: true })
  securityFlags: string[];
}
```

## Data Types and DTOs

### Web3AuthDto

```typescript
export class Web3AuthDto {
  @IsEthereumAddress()
  walletAddress: string;
  
  @IsString()
  signature: string;
  
  @IsString()
  nonce: string;
  
  @IsObject()
  deviceFingerprint: DeviceFingerprint;
  
  @IsObject()
  @IsOptional()
  locationData?: LocationData;
  
  @IsNumber()
  @IsOptional()
  chainId?: number;
}
```

### DeviceFingerprint

```typescript
export interface DeviceFingerprint {
  hardwareId: string;
  browserInfo: {
    name: string;
    version: string;
    language: string;
    platform: string;
  };
  screenResolution: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  timeZone: string;
  additionalData?: Record<string, any>;
}
```

### LocationData

```typescript
export interface LocationData {
  ip: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  country?: string;
  city?: string;
  timestamp: number;
}
```

## Configuration

The auth configuration is defined in `config/auth.config.ts`:

```typescript
export default registerAs('auth', () => ({
  accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'access-token-secret',
  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh-token-secret',
  accessTokenExpirySeconds: process.env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS || '900',
  refreshTokenExpiryDays: process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS || '30',
  nonceExpirySeconds: process.env.AUTH_NONCE_EXPIRY_SECONDS || '300',
  deviceVerification: {
    enabled: process.env.DEVICE_VERIFICATION_ENABLED === 'true',
    strictMode: process.env.DEVICE_VERIFICATION_STRICT_MODE === 'true',
  },
  geoLocationValidation: {
    enabled: process.env.GEOLOCATION_VALIDATION_ENABLED === 'true',
    suspiciousDistanceKm: parseInt(process.env.SUSPICIOUS_DISTANCE_KM || '500', 10),
  },
}));
```

## Security Features

### 1. Device Fingerprinting

Device fingerprinting collects browser and device information to create a unique identifier for each device:

```typescript
// Client-side fingerprinting code (simplified)
async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  // Generate a hardware ID based on browser and device characteristics
  const hardwareIdComponents = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    screen.width + 'x' + screen.height,
    navigator.deviceMemory || 'unknown',
    navigator.platform || 'unknown',
    // Add more device-specific characteristics
  ];
  
  // Hash the components to create a hardware ID
  const hardwareId = await hashString(hardwareIdComponents.join('|'));
  
  return {
    hardwareId,
    browserInfo: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      language: navigator.language,
      platform: navigator.platform,
    },
    screenResolution: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio,
    },
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
```

### 2. Geolocation Tracking

```typescript
// Client-side geolocation code (simplified)
async function getUserLocation(): Promise<LocationData> {
  // Get IP address from a service
  const ipResponse = await fetch('https://api.ipify.org?format=json');
  const { ip } = await ipResponse.json();
  
  try {
    // Request user's precise location
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
    
    return {
      ip,
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    // Fallback if user denies geolocation
    return {
      ip,
      timestamp: Date.now(),
    };
  }
}
```

### 3. IP Validation

The system tracks and validates IP addresses to detect suspicious changes:

```typescript
// Server-side IP validation (simplified)
function validateIpChange(storedIp: string, currentIp: string): boolean {
  if (storedIp === currentIp) {
    return true; // Same IP, no problem
  }
  
  // You could implement more sophisticated checks here:
  // - Check if IPs are in the same subnet
  // - Check if IPs are from the same geographical area
  // - Check if the change happened in a reasonable timeframe
  
  // Log the change for security auditing
  logger.warn(`IP address changed from ${storedIp} to ${currentIp}`);
  
  // For security, we don't block access just on IP change,
  // but flag it for further investigation
  return true;
}
```

### 4. Multi-Wallet Support

The system allows users to link multiple wallets to their account:

```typescript
// In WalletService (simplified)
async linkWalletToUser(
  userId: string,
  walletAddress: string,
  signature: string,
  message: string
): Promise<WalletConnection> {
  // Verify signature
  const recoveredAddress = ethers.utils.verifyMessage(message, signature);
  
  if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new UnauthorizedException('Invalid signature');
  }
  
  // Check if wallet is already linked to another user
  const existingWallet = await this.walletConnectionRepository.findOne({
    where: { address: walletAddress },
    relations: ['user'],
  });
  
  if (existingWallet && existingWallet.user.id !== userId) {
    throw new BadRequestException('Wallet already linked to another account');
  }
  
  // Create new wallet connection
  const wallet = this.walletConnectionRepository.create({
    user: { id: userId },
    address: walletAddress,
    network: 'ethereum', // or specific network like 'polygon'
    isPrimary: !(await this.hasWallets(userId)), // First wallet is primary
  });
  
  return await this.walletConnectionRepository.save(wallet);
}
```

## Authentication Flow

### Web3 Authentication Flow

```
1. Client: Request Nonce
   → POST /auth/web3/challenge { walletAddress }
   ← Server: { nonce }

2. Client: Sign Message
   → Sign message with wallet (metamask/walletconnect)
   → Collect device fingerprint
   → Collect location data (if permitted)

3. Client: Authenticate
   → POST /auth/web3/authenticate {
       walletAddress,
       signature,
       nonce,
       deviceFingerprint,
       locationData
     }
   ← Server: {
       accessToken,
       refreshToken,
       expiresAt,
       user: { id, walletAddress, ... }
     }

4. Client: Use Access Token
   → Include in Authorization header: Bearer {accessToken}

5. Client: Refresh Token
   → POST /auth/web3/refresh-token {
       refreshToken,
       deviceFingerprint,
       locationData
     }
   ← Server: New tokens
```

### Session Management Flow

```
1. Client: Regular Heartbeat
   → POST /auth/web3/heartbeat {
       deviceFingerprint,
       locationData
     }
   ← Server: { success: true }

2. Client: Logout
   → POST /auth/web3/logout {
       refreshToken
     }
   ← Server: { success: true }
```

## Database Entities

### User Entity (Relevant Parts)

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ nullable: true })
  username: string;
  
  @Column({ nullable: true })
  email: string;
  
  @Column('simple-array')
  roles: Role[];
  
  @Column({ nullable: true })
  authNonce: string;
  
  @Column({ nullable: true })
  authNonceExpires: Date;
  
  @OneToMany(() => WalletConnection, wallet => wallet.user)
  walletConnections: WalletConnection[];
  
  @OneToMany(() => Session, session => session.user)
  sessions: Session[];
  
  // Other user properties...
}
```

### Wallet Connection Entity

```typescript
@Entity('wallet_connections')
export class WalletConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() => User, user => user.walletConnections)
  user: User;
  
  @Column()
  address: string;
  
  @Column()
  network: string;
  
  @Column({ default: false })
  isPrimary: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ nullable: true })
  lastUsedAt: Date;
}
```

## Integration with Frontend

The frontend integrates with the Web3 authentication system using the following hooks and utilities:

### Web3Auth Hook

```typescript
export function useWeb3Auth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Connect wallet and authenticate
  const login = async () => {
    try {
      setLoading(true);
      
      // 1. Connect to wallet
      const walletAddress = await connectWallet();
      
      // 2. Get nonce
      const { nonce } = await api.post<{ nonce: string }>(
        '/auth/web3/challenge',
        { walletAddress }
      );
      
      // 3. Create signature message
      const message = `Welcome to AliveHuman!\n\nPlease sign this message to authenticate.\n\nNonce: ${nonce}\n\nThis signature will not trigger a blockchain transaction or cost any gas fees.`;
      
      // 4. Sign message
      const signature = await signMessage(message);
      
      // 5. Get device fingerprint
      const deviceFingerprint = await generateDeviceFingerprint();
      
      // 6. Get location data (if allowed)
      let locationData;
      try {
        locationData = await getUserLocation();
      } catch (err) {
        console.warn('Geolocation permission denied, using fallback location');
        locationData = await getFallbackLocation();
      }
      
      // 7. Authenticate
      const response = await api.post<AuthResponseDto>('/auth/web3/authenticate', {
        walletAddress,
        signature,
        nonce,
        deviceFingerprint,
        locationData,
        chainId: await getChainId(),
      });
      
      // 8. Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('tokenExpiry', response.expiresAt);
      
      // 9. Store user
      setUser(response.user);
      setIsAuthenticated(true);
      
      // 10. Start session heartbeat
      startSessionHeartbeat(deviceFingerprint);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Refreshes the token
  const refreshToken = async () => {
    // Implementation...
  };
  
  // Logout
  const logout = async () => {
    // Implementation...
  };
  
  // Session heartbeat
  const startSessionHeartbeat = (deviceFingerprint: DeviceFingerprint) => {
    // Implementation...
  };
  
  // Check if token needs refresh
  useEffect(() => {
    // Implementation...
  }, []);
  
  return {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
  };
}
```

## Security Recommendations

1. **Refresh Token Rotation**: Implement refresh token rotation where each refresh operation invalidates the previous refresh token.

2. **Rate Limiting**: Apply rate limiting to authentication endpoints to prevent brute force attacks.

3. **Session Monitoring**: Implement server-side monitoring for suspicious session activity.

4. **Automated Security Alerts**: Set up alerts for unusual authentication patterns.

5. **Regular Security Audits**: Conduct regular security audits of the authentication system.

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Invalid signature | Ensure the message format matches exactly between frontend and backend |
| Nonce expired | Adjust nonce expiry time and provide proper error handling |
| Session expiry | Implement proper token refresh logic |
| Device verification issues | Consider fallback mechanisms for legitimate device changes |
| Geolocation privacy | Make geolocation optional and provide alternatives |

## Conclusion

The Web3 Authentication System provides a secure, passwordless authentication mechanism for the AliveHuman platform. By leveraging blockchain wallet signatures combined with advanced security features like device fingerprinting and geolocation tracking, it offers a robust security model that balances user experience with strong authentication controls.
