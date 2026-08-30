import type { Auditable, SoftDeletable, Syncable } from '@/core/types/general';

export type MilestoneConditionType =
  | 'level'
  | 'lessons_completed'
  | 'words_learned'
  | 'streak_days'
  | 'longest_streak'
  | 'xp_earned';

export interface Milestone extends Auditable, Syncable, SoftDeletable {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: MilestoneConditionType;
  conditionValue: number;
  achievedAt?: string | null;
}
