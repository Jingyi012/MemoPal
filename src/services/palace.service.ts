import { palaceApi } from '@/api/palace';
import { locationApi } from '@/api/location';
import { createLocationRepository } from '@/repositories/location.repo';
import { createPalaceRepository } from '@/repositories/palace.repo';
import { Palace, PalaceDetails } from '@/types/palace';

const repo = createPalaceRepository();
const locationRepo = createLocationRepository();

/**
 * Get all palaces with sync fallback
 * Attempts backend sync, falls back to local DB
 */
export async function getPalaces(): Promise<Palace[]> {
  try {
    // Attempt to fetch and sync from backend
    const remote = await palaceApi.getAll();

    await repo.upsertMany(remote ?? [], { pruneMissingOfficial: true });
  } catch (error) {
    console.warn('Failed to sync palaces from backend, using local data:', error);
  }
  return await repo.getAll();
}

/**
 * Get palace by ID with sync
 */
export async function getPalaceById(id: string): Promise<PalaceDetails | undefined> {
  const localPalace = await repo.getById(id);
  const isUnsyncedCustomPalace = localPalace?.isCustom === true && !localPalace.lastSyncedAt;

  if (isUnsyncedCustomPalace) {
    return localPalace;
  }

  try {
    // Sync palace + locations so review flow always has location data
    const [remotePalace, remoteLocations] = await Promise.all([
      palaceApi.getById(id),
      locationApi.getByPalace(id),
    ]);

    if (remotePalace) {
      // Single-item sync must not prune other palaces.
      await repo.upsertMany([remotePalace], { pruneMissingOfficial: false });
    }

    if (remoteLocations?.length) {
      await locationRepo.upsertMany(remoteLocations);
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
  const id = await repo.save(palace);
  const created = await repo.getById(id);
  if (!created) throw new Error('Failed to create palace');
  return created;
}

/**
 * Update palace (local + queue for sync)
 */
export async function updatePalace(id: string, palace: Partial<Palace>): Promise<Palace> {
  await repo.save({ ...palace, id });
  const updated = await repo.getById(id);
  if (!updated) throw new Error('Failed to update palace');
  return updated;
}

/**
 * Delete palace (local + queue for sync)
 */
export async function deletePalace(id: string): Promise<boolean> {
  await repo.delete(id);
  return true;
}

/**
 * Unlock a palace for user
 */
export async function unlockPalace(palaceId: string): Promise<boolean> {
  const success = await palaceApi.unlockPalace(palaceId);
  return success;
}
