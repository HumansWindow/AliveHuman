/**
 * Diary feature-related types and interfaces
 */

export enum DiaryEntryVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  FRIENDS = 'friends',
}

export enum DiaryEntryMood {
  HAPPY = 'happy',
  SAD = 'sad',
  EXCITED = 'excited',
  ANXIOUS = 'anxious',
  CALM = 'calm',
  FRUSTRATED = 'frustrated',
  NEUTRAL = 'neutral',
}

export interface DiaryEntryLocation {
  name?: string;
  latitude?: number;
  longitude?: number;
}

export interface DiaryEntryMedia {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: DiaryEntryMood;
  location?: DiaryEntryLocation;
  media?: DiaryEntryMedia[];
  tags?: string[];
  visibility: DiaryEntryVisibility;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface DiaryEntryCreateDTO {
  title: string;
  content: string;
  mood?: DiaryEntryMood;
  location?: DiaryEntryLocation;
  media?: Omit<DiaryEntryMedia, 'id'>[];
  tags?: string[];
  visibility?: DiaryEntryVisibility;
  isEncrypted?: boolean;
}

export interface DiaryEntryUpdateDTO {
  title?: string;
  content?: string;
  mood?: DiaryEntryMood;
  location?: DiaryEntryLocation;
  media?: DiaryEntryMedia[];
  tags?: string[];
  visibility?: DiaryEntryVisibility;
}

export interface DiaryEntryQueryParams {
  userId?: string;
  visibility?: DiaryEntryVisibility;
  mood?: DiaryEntryMood;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}