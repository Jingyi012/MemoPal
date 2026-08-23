import { locationApi } from '@/features/palace/shared/api/location.api';
import type { Location } from '@/features/palace/shared/types/palace.types';

export async function getLocationsByPalace(palaceId: string): Promise<Location[]> {
  return (await locationApi.getByPalace(palaceId)) ?? [];
}

export async function getLocation(id: string): Promise<Location | null> {
  return (await locationApi.getById(id)) ?? null;
}

export async function createLocation(location: Partial<Location>): Promise<string> {
  const created = await locationApi.create(location);
  return created.id;
}

export async function updateLocation(id: string, location: Partial<Location>): Promise<void> {
  await locationApi.update({ ...location, id } as Location);
}

export async function deleteLocation(id: string): Promise<void> {
  await locationApi.delete(id);
}
