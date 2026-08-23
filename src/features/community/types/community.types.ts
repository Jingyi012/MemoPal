import type { LessonCategory } from '@/features/palace/shared/types/lesson.types';

export interface Creator {
  id: string;
  name: string;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface LessonStats {
  usageCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityLesson {
  id: string;
  title: string;
  description: string;
  words: { word: string; meaning: string }[];
  category: LessonCategory;
  tags: string[];
  creator: Creator;
  stats: LessonStats;
  shareCode: string;
  isPublic: boolean;
  isPremium?: boolean;
}
