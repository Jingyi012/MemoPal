import { palaceApi } from '@/api/palace';
import { createPalaceRepository } from '@/repositories/palace.repo';
import { Palace } from '@/types/palace';

const repo = createPalaceRepository();

/**
 * Get all palaces with sync fallback
 * Attempts backend sync, falls back to local DB
 */
export async function getPalaces(): Promise<Palace[]> {
  try {
    // Attempt to fetch and sync from backend
    const remote = await palaceApi.getAll();
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync palaces from backend, using local data:', error);
  }

  return await repo.getAll();
}

/**
 * Get palace by ID with sync
 */
export async function getPalaceById(id: string) {
  try {
    // Attempt backend sync
    const remote = await palaceApi.getById(id);
    if (remote) {
      await repo.upsertMany([remote]);
    }
  } catch (error) {
    console.warn('Failed to sync palace details, using local data:', error);
  }

  return await repo.getById(id);
}

/**
 * Create palace (local + queue for sync)
 * Offline-first: write locally, queue for async sync
 */
export async function createPalace(palace: Partial<Palace>): Promise<Palace> {
  // 1. Create locally first
  // Implementation: const localPalace = await palaceRepository.create(palace)
  // 2. Queue for sync: await syncQueue.add({action: 'create', entityType: 'PALACE', ...})

  // Fallback to API
  const created = await palaceApi.create(palace as Palace);
  return created;
}

/**
 * Update palace (local + queue for sync)
 */
export async function updatePalace(id: string, palace: Partial<Palace>): Promise<Palace> {
  // 1. Update locally first
  // 2. Queue for sync
  // Fallback to API
  const updated = await palaceApi.update({ ...(palace as Palace), id } as Palace);
  return updated;
}

/**
 * Delete palace (local + queue for sync)
 */
export async function deletePalace(id: string): Promise<boolean> {
  // 1. Delete locally first (or mark as deleted for soft delete)
  // 2. Queue for sync
  // Fallback to API
  await palaceApi.delete(id);
  return true;
}

/**
 * Unlock a palace for user
 */
export async function unlockPalace(userId: string, palaceId: string): Promise<boolean> {
  const success = await palaceApi.unlockPalace(userId, palaceId);
  return success;
}
