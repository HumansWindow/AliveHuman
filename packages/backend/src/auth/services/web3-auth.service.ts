import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { 
  Web3AuthDto, 
  RefreshTokenDto, 
  SessionHeartbeatDto, 
  AuthResponse,
  DeviceFingerprint 
} from '@alive-human/shared';
import { User } from '../../users/entities/user.entity';
import { Session } from '../entities/session.entity';
import { isPolygonNetwork } from '@alive-human/shared';

@Injectable()
export class Web3AuthService {
  private readonly logger = new Logger(Web3AuthService.name);
  private readonly challengeMap = new Map<string, { nonce: string, timestamp: number }>();
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a nonce challenge for wallet authentication
   */
  async generateChallenge(): Promise<{ message: string; nonce: string }> {
    const nonce = uuidv4();
    const message = `Sign this message to authenticate with AliveHuman: ${nonce}`;
    
    // Store the nonce with timestamp for verification later
    this.challengeMap.set(nonce, { 
      nonce,
      timestamp: Date.now()
    });
    
    return { message, nonce };
  }

  /**
   * Verify a wallet signature
   */
  async verifyWalletSignature(address: string, message: string, signature: string, chainId: string): Promise<boolean> {
    try {
      // For Ethereum/Polygon - same verification process
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Authenticate a user with wallet
   */
  async authenticateUser(authDto: Web3AuthDto): Promise<AuthResponse> {
    const { walletAddress, signature, nonce, deviceFingerprint, locationData, chainId } = authDto;
    
    // For Phase 1, verify the user is on Polygon network
    if (!isPolygonNetwork(chainId)) {
      throw new BadRequestException('Please connect to Polygon network');
    }
    
    // Verify the nonce exists and hasn't expired
    const challengeData = this.challengeMap.get(nonce);
    if (!challengeData) {
      throw new UnauthorizedException('Invalid or expired nonce');
    }
    
    if (Date.now() - challengeData.timestamp > this.CHALLENGE_EXPIRY) {
      this.challengeMap.delete(nonce);
      throw new UnauthorizedException('Challenge expired, please request a new one');
    }
    
    // Verify the signature
    const message = `Sign this message to authenticate with AliveHuman: ${nonce}`;
    const isSignatureValid = await this.verifyWalletSignature(walletAddress, message, signature, chainId);
    
    if (!isSignatureValid) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    // Delete the nonce after successful verification (one-time use)
    this.challengeMap.delete(nonce);
    
    // Find or create user
    let user = await this.userRepository.findOne({ where: { walletAddress } });
    
    if (!user) {
      user = this.userRepository.create({
        walletAddress,
        firstLoginAt: new Date(),
        lastLoginAt: new Date(),
        chainId: chainId
      });
      await this.userRepository.save(user);
    } else {
      // Update last login time and chain ID
      user.lastLoginAt = new Date();
      user.chainId = chainId;
      await this.userRepository.save(user);
    }
    
    // Create user session
    const session = this.sessionRepository.create({
      userId: user.id,
      walletAddress,
      deviceFingerprint,
      locationData,
      startTime: new Date(),
      lastActiveTime: new Date(),
      isActive: true,
      chainId: chainId
    });
    
    await this.sessionRepository.save(session);
    
    // Generate tokens
    const payload = { 
      sub: user.id, 
      wallet: walletAddress, 
      sessionId: session.id,
      chainId: chainId
    };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    
    // Update session with tokens
    session.refreshToken = refreshToken;
    await this.sessionRepository.save(session);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        chainId: user.chainId
      },
      session: {
        id: session.id,
        startTime: session.startTime,
      }
    };
  }

  /**
   * Refresh a user session
   */
  async refreshSession(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken, deviceFingerprint, locationData } = refreshTokenDto;
    
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      
      // Find the session
      const session = await this.sessionRepository.findOne({ 
        where: { 
          id: payload.sessionId,
          refreshToken,
          isActive: true
        }
      });
      
      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }
      
      // Verify device fingerprint
      const fingerprintMatch = this.verifyDeviceFingerprint(
        session.deviceFingerprint, 
        deviceFingerprint
      );
      
      if (!fingerprintMatch) {
        // Suspicious activity - different device
        await this.sessionRepository.update(session.id, { isActive: false });
        throw new UnauthorizedException('Device verification failed');
      }
      
      // Update session data
      session.lastActiveTime = new Date();
      session.locationData = locationData;
      await this.sessionRepository.save(session);
      
      // Generate new tokens
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      const newPayload = { 
        sub: user.id, 
        wallet: user.walletAddress, 
        sessionId: session.id,
        chainId: user.chainId
      };
      
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      });
      
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });
      
      // Update session with new refresh token
      session.refreshToken = newRefreshToken;
      await this.sessionRepository.save(session);
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          chainId: user.chainId
        },
        session: {
          id: session.id,
          startTime: session.startTime,
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Update session heartbeat
   */
  async updateSessionHeartbeat(heartbeatDto: SessionHeartbeatDto): Promise<boolean> {
    const { sessionId, lastActiveTime, locationData } = heartbeatDto;
    
    try {
      const session = await this.sessionRepository.findOne({ where: { id: sessionId, isActive: true } });
      
      if (!session) {
        return false;
      }
      
      // Update session data
      session.lastActiveTime = new Date(lastActiveTime);
      session.locationData = locationData;
      await this.sessionRepository.save(session);
      
      return true;
    } catch (error) {
      this.logger.error(`Session heartbeat failed: ${error.message}`);
      return false;
    }
  }

  /**
   * End a user session
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await this.sessionRepository.update(sessionId, { 
        isActive: false,
        endTime: new Date()
      });
      
      return true;
    } catch (error) {
      this.logger.error(`End session failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify device fingerprint
   */
  private verifyDeviceFingerprint(
    storedFingerprint: DeviceFingerprint, 
    currentFingerprint: DeviceFingerprint
  ): boolean {
    // Core hardware ID should match
    if (storedFingerprint.hardwareId !== currentFingerprint.hardwareId) {
      return false;
    }
    
    // Check for major browser changes
    if (storedFingerprint.browserInfo.name !== currentFingerprint.browserInfo.name) {
      return false;
    }
    
    // Check screen resolution
    if (storedFingerprint.screenResolution.width !== currentFingerprint.screenResolution.width ||
        storedFingerprint.screenResolution.height !== currentFingerprint.screenResolution.height) {
      return false;
    }
    
    // Allow some minor variations in other parameters
    // Return true if enough parameters match
    return true;
  }
}
