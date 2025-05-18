/**
 * User profile-related models and DTOs
 */

/**
 * Profile creation DTO
 */
export interface CreateProfileDto {
  username?: string;
  email?: string;
  profilePictureUrl?: string;
  displayName?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  country?: string;
  completeLater?: boolean;
}

/**
 * Profile update DTO
 */
export interface UpdateProfileDto {
  username?: string;
  email?: string;
  profilePictureUrl?: string;
  displayName?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  country?: string;
}

/**
 * Profile response
 */
export interface ProfileResponse {
  id: string;
  username?: string;
  email?: string;
  emailVerified: boolean;
  walletAddress: string;
  chainId: string;
  profilePictureUrl?: string;
  displayName?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  country?: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
