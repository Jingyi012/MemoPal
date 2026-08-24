import { badgeApi } from '@/features/gamification/shared/api/badge';
import { Badge } from '@/features/gamification/shared/types/levelAndbadge';

/**
 * Get all available badges with two-way sync
 * Strategy: Download remote updates, merge with local using conflict resolution
 */
export async function getAllBadges(): Promise<Badge[]> {
  return (await badgeApi.getAll()) ?? [];
}

/**
 * Get badge by ID with fallback to local
 */
export async function getBadgeById(id: string) {
  return badgeApi.getById(id);
}

/**
 * Award a badge to user (offline-first)
 */
export async function awardBadge(badgeId: string): Promise<void> {
  await badgeApi.awardBadge(badgeId);
}

export async function hasEarnedBadge(badgeId: string): Promise<boolean> {
  return Boolean((await badgeApi.getById(badgeId)).earnedAt);
}
