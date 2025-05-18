import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateProfileDto, UpdateProfileDto } from '@alive-human/shared';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get a user's profile by user ID
   */
  async getProfileById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    
    return user;
  }

  /**
   * Get a user's profile by wallet address
   */
  async getProfileByWalletAddress(walletAddress: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { walletAddress } });
    
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    
    return user;
  }

  /**
   * Create a new user profile
   */
  async createProfile(userId: string, createProfileDto: CreateProfileDto): Promise<User> {
    // Find the user first
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // If email is provided, check if it's already in use
    if (createProfileDto.email) {
      const existingUserWithEmail = await this.userRepository.findOne({ 
        where: { email: createProfileDto.email } 
      });
      
      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }
    
    // Update user with profile data
    Object.assign(user, createProfileDto);
    
    return this.userRepository.save(user);
  }

  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    
    // If email is changing, check if it's already in use
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findOne({ 
        where: { email: updateProfileDto.email } 
      });
      
      if (existingUserWithEmail) {
        throw new BadRequestException('Email already in use');
      }
      
      // Reset email verification if email changes
      user.emailVerified = false;
    }
    
    // Update user with profile data
    Object.assign(user, updateProfileDto);
    
    return this.userRepository.save(user);
  }

  /**
   * Check if a user has a complete profile
   */
  async hasCompleteProfile(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return false;
    }
    
    // Define what constitutes a complete profile - modify as needed
    const isComplete = !!(user.username && user.email);
    
    return isComplete;
  }

  /**
   * Delete a user's profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    
    await this.userRepository.remove(user);
  }
}
