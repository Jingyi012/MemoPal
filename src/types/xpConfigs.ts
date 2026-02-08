export type SourceType =
  | 'lesson_complete'
  | 'review_complete'
  | 'word_mastered'
  | 'streak_bonus'
  | 'manual_adjustment';

export interface XpConfig {
  id: string;
  sourceType: SourceType;
  baseXp: number;
  variableXp: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
