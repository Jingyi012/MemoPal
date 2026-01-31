export type SourceType =
  | 'lesson_complete'
  | 'review_complete'
  | 'word_mastered'
  | 'streak_bonus'
  | 'manual_adjustment';

export interface XpConfigs {
  id: string;
  sourceType: SourceType;
  xpAmount: number;
  isActive: boolean;
}
