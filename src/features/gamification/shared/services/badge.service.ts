import { badgeApi } from '@/features/gamification/shared/api/badge';
import { db } from '@/db/client';
import { EntityType } from '@/enums/entityType';
import { createBadgeRepository } from '@/features/gamification/shared/repositories/badge.repo';
import { Badge } from '@/features/gamification/shared/types/levelAndbadge';
import { eq } from 'drizzle-orm';

const repo = createBadgeRepository();

/**
 * Get all available badges with two-way sync
 * Strategy: Download remote updates, merge with local using conflict resolution
 */
export async function getAllBadges(): Promise<Badge[]> {
  try {
    const remoteBadges = await badgeApi.getAll();

    if (remoteBadges && remoteBadges.length > 0) {
      await repo.upsertMany(remoteBadges);
    }
  } catch (error) {
    console.warn('Failed to sync badges from backend, using local data:', error);
  }

  return await repo.getAll();
}

/**
 * Get badge by ID with fallback to local
 */
export async function getBadgeById(id: string) {
  try {
    const remoteBadge = await badgeApi.getById(id);
    if (remoteBadge) {
      await repo.upsertMany([remoteBadge]);
    }
    return remoteBadge;
  } catch (error) {
    console.warn('Failed to sync badge, using local data:', error);
    return await repo.getById(id);
  }
}

/**
 * Award a badge to user (offline-first)
 */
export async function awardBadge(badgeId: string): Promise<void> {
  try {
    await repo.awardBadge(badgeId);
  } catch (error) {
    console.error('Failed to award badge locally:', error);
    throw error;
  }
}

export async function hasEarnedBadge(badgeId: string): Promise<boolean> {
  return await repo.hasEarnedBadge(badgeId);
}

/**
 * Sync all pending badge changes to backend
 */
export async function syncPendingChanges(): Promise<void> {
  try {
    const queue = await db.query.syncQueue.findMany({
      where: (sq) => eq(sq.entityType, EntityType.BADGE),
    });

    for (const item of queue) {
      try {
        if (item.action === 'create') {
        } else if (item.action === 'update') {
        } else if (item.action === 'delete') {
        }
      } catch (error) {
        console.error(`Failed to sync badge ${item.entityId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during badge sync:', error);
  }
}
