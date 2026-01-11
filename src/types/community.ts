export type LessonCategory =
  | 'language-learning'
  | 'vocabulary'
  | 'medical'
  | 'science'
  | 'history'
  | 'business'
  | 'test-prep'
  | 'general';

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
  words: { word: string; translation: string }[];
  category: LessonCategory;
  tags: string[];
  creator: Creator;
  stats: LessonStats;
  shareCode: string;
  isPublic: boolean;
  isPremium?: boolean;
}
