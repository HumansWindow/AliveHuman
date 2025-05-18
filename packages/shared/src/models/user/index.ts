/**
 * User-related types and interfaces
 */

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface UserProfile {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    instagram?: string;
  };
}

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  role: UserRole;
  status: UserStatus;
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  referralCode?: string;
  referredBy?: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
}

export interface UserCreateDTO {
  email?: string;
  walletAddress?: string;
  password?: string;
  role?: UserRole;
  profile?: UserProfile;
  referredBy?: string;
}

export interface UserUpdateDTO {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  profile?: UserProfile;
}