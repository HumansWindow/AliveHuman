import { Controller, Post, Body, UseGuards, HttpCode, Get, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Web3AuthService } from '../services/web3-auth.service';
import { 
  Web3AuthDto, 
  RefreshTokenDto, 
  SessionHeartbeatDto, 
  AuthResponse 
} from '@alive-human/shared';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('auth/web3')
export class Web3AuthController {
  constructor(private readonly web3AuthService: Web3AuthService) {}

  /**
   * Generate a nonce challenge for wallet authentication
   * @returns Object containing the challenge message and nonce
   */
  @Get('challenge')
  async getChallenge(): Promise<{ message: string; nonce: string }> {
    return this.web3AuthService.generateChallenge();
  }

  /**
   * Authenticate user with wallet signature
   * @param authDto Web3 authentication data
   * @returns Authentication response with tokens and user info
   */
  @Post('authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() authDto: Web3AuthDto): Promise<AuthResponse> {
    return this.web3AuthService.authenticateUser(authDto);
  }

  /**
   * Refresh an authentication token
   * @param refreshTokenDto Refresh token data
   * @returns New authentication tokens
   */
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    return this.web3AuthService.refreshSession(refreshTokenDto);
  }

  /**
   * Update session heartbeat to keep the session alive
   * @param heartbeatDto Session heartbeat data
   * @returns Success status
   */
  @Post('session-heartbeat')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sessionHeartbeat(
    @CurrentUser('sessionId') sessionId: string,
    @Body() heartbeatDto: SessionHeartbeatDto
  ): Promise<{ success: boolean }> {
    // Verify that the sessionId in the token matches the one in the request
    if (sessionId !== heartbeatDto.sessionId) {
      throw new UnauthorizedException('Invalid session');
    }
    
    const success = await this.web3AuthService.updateSessionHeartbeat(heartbeatDto);
    return { success };
  }

  /**
   * End a user session
   * @param sessionId Session ID to end
   * @returns Success status
   */
  @Post('end-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async endSession(
    @CurrentUser('sessionId') sessionId: string,
    @Body() body: { sessionId: string }
  ): Promise<{ success: boolean }> {
    // Verify that the sessionId in the token matches the one in the request
    if (sessionId !== body.sessionId) {
      throw new UnauthorizedException('Invalid session');
    }
    
    const success = await this.web3AuthService.endSession(sessionId);
    return { success };
  }
}
