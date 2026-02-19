import { locationApi } from '@/api/location';
import { createLocationRepository } from '@/repositories/location.repo';
import { Location } from '@/types/palace';

const repo = createLocationRepository();

export async function getLocationsByPalace(palaceId: string): Promise<Location[]> {
  try {
    const remote = await locationApi.getByPalace(palaceId);
    if (remote && remote.length > 0) {
      await repo.upsertMany(remote);
    }
  } catch (error) {
    console.warn('Failed to sync locations from backend, using local data:', error);
  }

  return await repo.getByPalace(palaceId);
}

export async function getLocation(id: string): Promise<Location | null> {
  try {
    const remote = await locationApi.getById(id);
    if (remote) {
      await repo.upsertMany([remote]);
    }
  } catch (error) {
    console.warn('Failed to sync location details, using local data:', error);
  }

  return await repo.getById(id);
}

export async function createLocation(location: Partial<Location>): Promise<string> {
  return await repo.save(location);
}

export async function updateLocation(id: string, location: Partial<Location>): Promise<void> {
  await repo.save({ ...location, id });
}

export async function deleteLocation(id: string): Promise<void> {
  await repo.delete(id);
}

export async function syncPendingChanges(): Promise<void> {
  try {
    // Location sync handled by SyncBase queue
    console.log('Location sync queue handled by SyncBase');
  } catch (error) {
    console.error('Location sync error:', error);
  }
}
