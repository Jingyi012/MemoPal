import { Auditable, SoftDeletable, Syncable } from './general';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge extends Auditable, Syncable, SoftDeletable {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon: string | null;
  iconUrl?: string | null;
  rarity: BadgeRarity | null;
  earnedAt?: string | null;
}

export interface Milestone extends Auditable, Syncable, SoftDeletable {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: 'total_xp' | 'level' | 'lessons_completed' | 'words_learned' | 'streak_days';
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
