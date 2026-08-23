import { locationApi } from '@/features/palace/shared/api/location.api';
import { palaceApi } from '@/features/palace/shared/api/palace.api';
import type { Palace, PalaceDetails } from '@/features/palace/shared/types/palace.types';

export async function getPalaces(): Promise<Palace[]> {
  return (await palaceApi.getAll()) ?? [];
}

export async function getPalaceById(id: string): Promise<PalaceDetails | undefined> {
  const [palace, locations] = await Promise.all([
    palaceApi.getById(id),
    locationApi.getByPalace(id),
  ]);
  return palace ? { ...palace, locations: locations ?? [] } : undefined;
}

export async function createPalace(palace: Partial<Palace>): Promise<Palace> {
  return palaceApi.create(palace);
}

export async function updatePalace(id: string, palace: Partial<Palace>): Promise<Palace> {
  return palaceApi.update({ ...palace, id } as Palace);
}

export async function deletePalace(id: string): Promise<boolean> {
  await palaceApi.delete(id);
  return true;
}

export async function unlockPalace(palaceId: string): Promise<boolean> {
  return palaceApi.unlockPalace(palaceId);
}
