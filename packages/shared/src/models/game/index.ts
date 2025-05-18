/**
 * Game feature-related types and interfaces
 */

export enum GameStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export interface GameStats {
  level: number;
  experience: number;
  skillPoints: number;
  achievements: string[];
  longestStreak: number;
  currentStreak: number;
  totalPlayTime: number;
  lastPlayedAt?: Date;
}

export interface GameSkill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  icon?: string;
  unlockRequirement?: {
    level?: number;
    skillId?: string;
    skillLevel?: number;
  };
}

export interface GameInventoryItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'cosmetic' | 'collectible';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  isEquipped: boolean;
  acquiredAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface GameAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSecret: boolean;
  rewardType?: 'item' | 'token' | 'skill' | 'cosmetic';
  rewardId?: string;
  rewardQuantity?: number;
  unlockedAt?: Date;
  progress?: number;
  total?: number;
}

export interface GameProgressEvent {
  userId: string;
  eventType: 
    | 'levelUp' 
    | 'achievementUnlocked' 
    | 'skillUpgraded'
    | 'itemAcquired'
    | 'questCompleted'
    | 'dailyTaskCompleted'
    | 'streakIncreased';
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface GameProfile {
  userId: string;
  nickname?: string;
  avatar?: string;
  title?: string;
  stats: GameStats;
  skills: GameSkill[];
  inventory: GameInventoryItem[];
  achievements: GameAchievement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameLeaderboardEntry {
  userId: string;
  nickname: string;
  avatar?: string;
  rank: number;
  score: number;
  level: number;
  updatedAt: Date;
}

export type GameLeaderboardType = 'daily' | 'weekly' | 'monthly' | 'allTime';

export interface GameLeaderboardParams {
  type: GameLeaderboardType;
  limit?: number;
  offset?: number;
}