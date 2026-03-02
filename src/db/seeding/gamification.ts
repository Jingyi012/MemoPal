import { SourceType } from '@/enums/sourceType';

export const LEVEL_CONFIGS = [
  { level: 1, requiredXp: 0, title: 'Novice' },
  { level: 2, requiredXp: 120, title: 'Apprentice' },
  { level: 3, requiredXp: 320, title: 'Scholar' },
  { level: 4, requiredXp: 640, title: 'Navigator' },
  { level: 5, requiredXp: 1000, title: 'Memory Keeper' },
  { level: 6, requiredXp: 1500, title: 'Palace Master' },
  { level: 7, requiredXp: 2200, title: 'Mind Architect' },
];

export const XP_CONFIGS = [
  { id: 'xp-lesson-complete', sourceType: SourceType.LessonComplete, baseXp: 35, variableXp: 10, isActive: true },
  { id: 'xp-lesson-initial', sourceType: SourceType.LessonInitialCompletion, baseXp: 20, variableXp: 5, isActive: true },
  { id: 'xp-review-complete', sourceType: SourceType.ReviewComplete, baseXp: 15, variableXp: 5, isActive: true },
  { id: 'xp-streak-bonus', sourceType: SourceType.StreakBonus, baseXp: 10, variableXp: 0, isActive: true },
  { id: 'xp-manual-adjustment', sourceType: SourceType.ManualAdjustment, baseXp: 50, variableXp: 0, isActive: true },
];

export const MILESTONES = [
  { id: 'ms-first-lesson', key: 'first_lesson_completed', title: 'First Step', description: 'Complete your first lesson', conditionType: 'lessons_completed' as const, conditionValue: 1 },
  { id: 'ms-first-palace', key: 'first_palace_completed', title: 'Palace Finisher', description: 'Complete all 30 lessons in one palace', conditionType: 'lessons_completed' as const, conditionValue: 30 },
  { id: 'ms-100-words', key: 'hundred_words', title: 'Word Collector', description: 'Learn 100 words', conditionType: 'words_learned' as const, conditionValue: 100 },
  { id: 'ms-level-5', key: 'reach_level_5', title: 'Mind Ascender', description: 'Reach level 5', conditionType: 'level' as const, conditionValue: 5 },
];

export const BADGES = [
  { id: 'badge-first-lesson', key: 'first_lesson', name: 'First Spark', description: 'Complete your first lesson', icon: 'sparkles', iconUrl: null, rarity: 'common' as const },
  { id: 'badge-palace-complete', key: 'palace_complete', name: 'Palace Conqueror', description: 'Complete one full palace', icon: 'castle', iconUrl: null, rarity: 'rare' as const },
  { id: 'badge-review-25', key: 'review_25', name: 'Recall Runner', description: 'Complete 25 reviews', icon: 'brain', iconUrl: null, rarity: 'epic' as const },
  { id: 'badge-level-5', key: 'level_5', name: 'Mind Architect', description: 'Reach Level 5', icon: 'crown', iconUrl: null, rarity: 'legendary' as const },
];
