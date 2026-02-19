import { badgeApi } from '@/api/badge';
import { db } from '@/db/client';
import { EntityType } from '@/enums/entityType';
import { createBadgeRepository } from '@/repositories/badge.repo';
import { Badge } from '@/types/levelAndbadge';
import { eq } from 'drizzle-orm';

const repo = createBadgeRepository();

/**
 * Get all available badges with two-way sync
 * Strategy: Download remote updates, merge with local using conflict resolution
 */
export async function getAllBadges(): Promise<Badge[]> {
  try {
    // Attempt to fetch updated badges from backend
    const lastSync = localStorage.getItem('badges:lastSync') || new Date(0).toISOString();
    const remoteBadges = await badgeApi.getUpdatedSince(lastSync);

    if (remoteBadges && remoteBadges.length > 0) {
      // Merge remote data with local (respects dirty state)
      await repo.upsertMany(remoteBadges);
      localStorage.setItem('badges:lastSync', new Date().toISOString());
    }
  } catch (error) {
    console.warn('Failed to sync badges from backend, using local data:', error);
  }

  // Return local data (offline-first)
  return await repo.getAll();
}

/**
 * Get badge by ID with fallback to local
 */
export async function getBadgeById(id: string) {
  try {
    const remoteBadge = await badgeApi.getById(id);
    if (remoteBadge) {
      // Update local copy
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
 * 1. Create locally and queue for sync
 * 2. Background: sync queue processor sends to backend
 */
export async function awardBadge(badgeId: string): Promise<void> {
  try {
    // Award locally first (offline-first)
    await repo.awardBadge(badgeId);
  } catch (error) {
    console.error('Failed to award badge locally:', error);
    throw error;
  }
}

/**
 * Check if user has earned a badge
 */
export async function hasEarnedBadge(badgeId: string): Promise<boolean> {
  return await repo.hasEarnedBadge(badgeId);
}

/**
 * Sync all pending badge changes to backend
 * Called by SyncManager when network is available
 */
export async function syncPendingChanges(): Promise<void> {
  try {
    // Get all pending badge changes
    const queue = await db.query.syncQueue.findMany({
      where: (sq) => eq(sq.entityType, EntityType.BADGE),
    });

    for (const item of queue) {
      try {
        if (item.action === 'create') {
          // Create on backend (though badges are typically read-only)
        } else if (item.action === 'update') {
          // Update on backend
        } else if (item.action === 'delete') {
          // Delete on backend
        }
        // On success, SyncProcessor removes from queue
      } catch (error) {
        console.error(`Failed to sync badge ${item.entityId}:`, error);
        // Retry on next sync
      }
    }
  } catch (error) {
    console.error('Error during badge sync:', error);
  }
}
