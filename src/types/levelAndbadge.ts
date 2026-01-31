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
}

export interface Milestone extends Auditable, Syncable, SoftDeletable {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: 'total_xp' | 'level' | 'lessons_completed' | 'words_learned' | 'streak_days';
  conditionValue: number;
}

export interface UserStats {
  userId: string;
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  updatedAt: string;
}

export interface UserBadges {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface UserMilestones {
  id: string;
  userId: string;
  milestoneId: string;
  achievedAt: string;
}
