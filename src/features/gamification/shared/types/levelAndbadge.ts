import { Auditable, SoftDeletable, Syncable } from '@/core/types/general';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge extends Auditable, Syncable, SoftDeletable {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon: string | null;
  iconUrl?: string | null;
  rarity: BadgeRarity | null;
  conditionType: BadgeConditionType;
  conditionValue: number;
  earnedAt?: string | null;
}

export type BadgeConditionType =
  | 'manual'
  | 'level'
  | 'lessons_completed'
  | 'words_learned'
  | 'streak_days'
  | 'missions_completed'
  | 'total_reviews'
  | 'total_xp';

export interface Milestone extends Auditable, Syncable, SoftDeletable {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: 'level' | 'lessons_completed' | 'words_learned' | 'streak_days';
  conditionValue: number;
  achievedAt?: string | null;
}

export interface UserStats {
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  updatedAt: string;
}
