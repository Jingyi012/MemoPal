import { locationApi } from '@/features/palace/shared/api/location.api';
import { createLocationRepository } from '@/features/palace/shared/repositories/location.repository';
import { createPalaceRepository } from '@/features/palace/shared/repositories/palace.repository';
import type { Location } from '@/features/palace/shared/types/palace.types';

const repo = createLocationRepository();
const palaceRepo = createPalaceRepository();

export async function getLocationsByPalace(palaceId: string): Promise<Location[]> {
  const localPalace = await palaceRepo.getById(palaceId);
  const isUnsyncedCustomPalace = localPalace?.isCustom === true && !localPalace.lastSyncedAt;
  if (isUnsyncedCustomPalace) return repo.getByPalace(palaceId);

  try {
    const remote = await locationApi.getByPalace(palaceId);
    await repo.upsertMany(remote ?? [], { pruneMissingSynced: true, palaceId });
  } catch (error) {
    console.warn('Failed to sync locations from backend, using local data:', error);
  }
  return repo.getByPalace(palaceId);
}

export async function getLocation(id: string): Promise<Location | null> {
  try {
    const remote = await locationApi.getById(id);
    if (remote) await repo.upsertMany([remote]);
  } catch (error) {
    console.warn('Failed to sync location details, using local data:', error);
  }
  return repo.getById(id);
}

export async function createLocation(location: Partial<Location>): Promise<string> {
  return repo.save(location);
}

export async function updateLocation(id: string, location: Partial<Location>): Promise<void> {
  await repo.save({ ...location, id });
}

export async function deleteLocation(id: string): Promise<void> {
  await repo.delete(id);
}

export async function syncPendingChanges(): Promise<void> {
  try {
    console.log('Location sync queue handled by SyncBase');
  } catch (error) {
    console.error('Location sync error:', error);
  }
}
