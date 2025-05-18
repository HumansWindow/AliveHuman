import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Session } from '../entities/session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate the JWT token and return the user
   * @param payload JWT payload
   * @returns The authenticated user
   */
  async validate(payload: any) {
    const { sub: userId, sessionId, wallet: walletAddress } = payload;

    // Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Find the session
    const session = await this.sessionRepository.findOne({ 
      where: { id: sessionId, isActive: true } 
    });
    if (!session) {
      throw new UnauthorizedException('Session not found or inactive');
    }

    // Return user with additional data needed for authorization
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };
  }
}
