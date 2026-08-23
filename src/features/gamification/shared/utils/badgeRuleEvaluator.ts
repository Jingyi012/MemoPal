import type { BadgeConditionType } from '@/features/gamification/shared/types/levelAndbadge';

export type BadgeAchievementMetrics = {
  completedLessons: number;
  learnedWords: number;
  level: number;
  totalReviews: number;
  totalXp: number;
  currentStreak: number;
  missionCompletions: number;
};

export function isBadgeAchievementMet(
  badge: {
    conditionType?: BadgeConditionType | string | null;
    conditionValue?: number | null;
  },
  metrics: BadgeAchievementMetrics
): boolean {
  const conditionType = (badge.conditionType ?? 'manual').trim().toLowerCase();
  const target = Number(badge.conditionValue ?? 0);

  if (Number.isNaN(target)) return false;

  switch (conditionType) {
    case 'level':
      return metrics.level >= Math.max(1, target);
    case 'lessons_completed':
      return metrics.completedLessons >= Math.max(1, target);
    case 'words_learned':
      return metrics.learnedWords >= Math.max(1, target);
    case 'streak_days':
      return metrics.currentStreak >= Math.max(1, target);
    case 'missions_completed':
      return metrics.missionCompletions >= Math.max(1, target);
    case 'total_reviews':
      return metrics.totalReviews >= Math.max(1, target);
    case 'total_xp':
      return metrics.totalXp >= Math.max(1, target);
    case 'manual':
    default:
      return false;
  }
}
