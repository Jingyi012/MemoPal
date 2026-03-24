import { SourceType } from '@/enums/sourceType';

export const LEVEL_CONFIGS = [
  { level: 1, requiredXp: 0, title: 'Novice' },
  { level: 2, requiredXp: 120, title: 'Apprentice' },
  { level: 3, requiredXp: 280, title: 'Scholar' },
  { level: 4, requiredXp: 480, title: 'Navigator' },
  { level: 5, requiredXp: 720, title: 'Strategist' },
  { level: 6, requiredXp: 1000, title: 'Mnemonist' },
  { level: 7, requiredXp: 1320, title: 'Archivist' },
  { level: 8, requiredXp: 1680, title: 'Mind Architect' },
  { level: 9, requiredXp: 2080, title: 'Memory Master' },
  { level: 10, requiredXp: 2520, title: 'Palace Sage' },
];

export const XP_CONFIGS = [
  { id: 'xp-lesson-complete', sourceType: SourceType.LessonComplete, baseXp: 40, variableXp: 15, isActive: true },
  { id: 'xp-lesson-initial', sourceType: SourceType.LessonInitialCompletion, baseXp: 25, variableXp: 10, isActive: true },
  { id: 'xp-review-complete', sourceType: SourceType.ReviewComplete, baseXp: 15, variableXp: 5, isActive: true },
  { id: 'xp-mission-complete', sourceType: SourceType.MissionComplete, baseXp: 35, variableXp: 0, isActive: true },
  { id: 'xp-word-mastered', sourceType: SourceType.WordMastered, baseXp: 8, variableXp: 2, isActive: true },
  { id: 'xp-streak-bonus', sourceType: SourceType.StreakBonus, baseXp: 12, variableXp: 0, isActive: true },
  { id: 'xp-manual-adjustment', sourceType: SourceType.ManualAdjustment, baseXp: 50, variableXp: 0, isActive: true },
];

export const MILESTONES = [
  { id: 'ms-lessons-1', key: 'lessons_completed_1', title: 'First Step', description: 'Complete your first lesson', conditionType: 'lessons_completed' as const, conditionValue: 1 },
  { id: 'ms-lessons-5', key: 'lessons_completed_5', title: 'Steady Learner', description: 'Complete 5 lessons', conditionType: 'lessons_completed' as const, conditionValue: 5 },
  { id: 'ms-lessons-20', key: 'lessons_completed_20', title: 'Lesson Architect', description: 'Complete 20 lessons', conditionType: 'lessons_completed' as const, conditionValue: 20 },
  { id: 'ms-lessons-50', key: 'lessons_completed_50', title: 'Lesson Master', description: 'Complete 50 lessons', conditionType: 'lessons_completed' as const, conditionValue: 50 },
  { id: 'ms-words-50', key: 'words_learned_50', title: 'Word Collector I', description: 'Learn 50 words', conditionType: 'words_learned' as const, conditionValue: 50 },
  { id: 'ms-words-150', key: 'words_learned_150', title: 'Word Collector II', description: 'Learn 150 words', conditionType: 'words_learned' as const, conditionValue: 150 },
  { id: 'ms-words-300', key: 'words_learned_300', title: 'Word Collector III', description: 'Learn 300 words', conditionType: 'words_learned' as const, conditionValue: 300 },
  { id: 'ms-streak-3', key: 'streak_days_3', title: 'Consistency Start', description: 'Maintain a 3-day streak', conditionType: 'streak_days' as const, conditionValue: 3 },
  { id: 'ms-streak-7', key: 'streak_days_7', title: 'Consistency Core', description: 'Maintain a 7-day streak', conditionType: 'streak_days' as const, conditionValue: 7 },
  { id: 'ms-streak-30', key: 'streak_days_30', title: 'Consistency Champion', description: 'Maintain a 30-day streak', conditionType: 'streak_days' as const, conditionValue: 30 },
  { id: 'ms-level-2', key: 'level_2', title: 'Level 2', description: 'Reach level 2', conditionType: 'level' as const, conditionValue: 2 },
  { id: 'ms-level-5', key: 'level_5', title: 'Level 5', description: 'Reach level 5', conditionType: 'level' as const, conditionValue: 5 },
  { id: 'ms-level-8', key: 'level_8', title: 'Level 8', description: 'Reach level 8', conditionType: 'level' as const, conditionValue: 8 },
  { id: 'ms-level-10', key: 'level_10', title: 'Level 10', description: 'Reach level 10', conditionType: 'level' as const, conditionValue: 10 },
];

export const BADGES = [
  { id: 'badge-review-rhythm', key: 'review_rhythm', name: 'Review Rhythm', description: 'Complete daily review goals consistently', icon: 'clock', iconUrl: null, rarity: 'common' as const, conditionType: 'total_reviews' as const, conditionValue: 10 },
  { id: 'badge-review-streak-7', key: 'review_streak_7', name: 'Recall Runner', description: 'Maintain a 7-day review streak', icon: 'bolt', iconUrl: null, rarity: 'rare' as const, conditionType: 'streak_days' as const, conditionValue: 7 },
  { id: 'badge-review-streak-30', key: 'review_streak_30', name: 'Recall Guardian', description: 'Maintain a 30-day review streak', icon: 'shield', iconUrl: null, rarity: 'epic' as const, conditionType: 'streak_days' as const, conditionValue: 30 },
  { id: 'badge-lesson-sprinter', key: 'lesson_sprinter', name: 'Lesson Sprinter', description: 'Complete lessons consistently each week', icon: 'rocket', iconUrl: null, rarity: 'rare' as const, conditionType: 'lessons_completed' as const, conditionValue: 5 },
  { id: 'badge-palace-pioneer', key: 'palace_pioneer', name: 'Palace Pioneer', description: 'Complete your first memory palace route', icon: 'map', iconUrl: null, rarity: 'common' as const, conditionType: 'lessons_completed' as const, conditionValue: 1 },
  { id: 'badge-memory-builder', key: 'memory_builder', name: 'Memory Builder', description: 'Build a strong set of lessons and reviews', icon: 'tool', iconUrl: null, rarity: 'rare' as const, conditionType: 'lessons_completed' as const, conditionValue: 10 },
  { id: 'badge-word-collector', key: 'word_collector_300', name: 'Word Collector', description: 'Learn and retain 300 words', icon: 'book', iconUrl: null, rarity: 'epic' as const, conditionType: 'words_learned' as const, conditionValue: 300 },
  { id: 'badge-level-climber', key: 'level_climber_5', name: 'Level Climber', description: 'Reach level 5', icon: 'mountain', iconUrl: null, rarity: 'rare' as const, conditionType: 'level' as const, conditionValue: 5 },
  { id: 'badge-level-master', key: 'level_master_10', name: 'Palace Sage', description: 'Reach level 10 mastery', icon: 'crown', iconUrl: null, rarity: 'legendary' as const, conditionType: 'level' as const, conditionValue: 10 },
  { id: 'badge-mission-specialist', key: 'mission_specialist', name: 'Mission Specialist', description: 'Complete mission tracks consistently', icon: 'target', iconUrl: null, rarity: 'epic' as const, conditionType: 'missions_completed' as const, conditionValue: 5 },
];
