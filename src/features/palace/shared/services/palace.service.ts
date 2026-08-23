import { locationApi } from '@/features/palace/shared/api/location.api';
import { palaceApi } from '@/features/palace/shared/api/palace.api';
import { createLocationRepository } from '@/features/palace/shared/repositories/location.repository';
import { createPalaceRepository } from '@/features/palace/shared/repositories/palace.repository';
import { createUserRepository, LocalUserAccess } from '@/features/profile/repositories/user.repo';
import type { Palace, PalaceDetails } from '@/features/palace/shared/types/palace.types';

const repo = createPalaceRepository();
const locationRepo = createLocationRepository();
const userRepo = createUserRepository();

function applyOfflineLockState<T extends Palace | PalaceDetails>(palace: T, access: LocalUserAccess): T {
  const requiredLevel = Math.max(1, palace.level ?? 1);
  const isOwnedCustom = Boolean(
    palace.isCustom && (!palace.createdBy || (access.userId && palace.createdBy === access.userId))
  );
  const isCustomLocked = Boolean(palace.isCustom && !isOwnedCustom);
  const isPremiumLocked = Boolean(!palace.isCustom && palace.isPremium && !access.isPremium);
  const isLevelLocked = Boolean(!palace.isCustom && !palace.isPremium && access.level < requiredLevel);
  const effectiveLocked = isCustomLocked || isPremiumLocked || isLevelLocked;

  return {
    ...palace,
    isLocked: effectiveLocked,
    unlockedAt: effectiveLocked ? null : (palace.unlockedAt ?? new Date().toISOString()),
  } as T;
}

export async function getPalaces(): Promise<Palace[]> {
  try {
    const remote = await palaceApi.getAll();
    await repo.upsertMany(remote ?? [], { pruneMissingOfficial: true });
  } catch (error) {
    console.warn('Failed to sync palaces from backend, using local data:', error);
  }
  const localPalaces = await repo.getAll();
  const localUserAccess = await userRepo.getLocalUserAccess();
  return localPalaces.map((palace) => applyOfflineLockState(palace, localUserAccess));
}

export async function getPalaceById(id: string): Promise<PalaceDetails | undefined> {
  const localUserAccess = await userRepo.getLocalUserAccess();
  const localPalace = await repo.getById(id);
  const isUnsyncedCustomPalace = localPalace?.isCustom === true && !localPalace.lastSyncedAt;

  if (isUnsyncedCustomPalace) return applyOfflineLockState(localPalace, localUserAccess);

  try {
    const [remotePalace, remoteLocations] = await Promise.all([
      palaceApi.getById(id),
      locationApi.getByPalace(id),
    ]);
    if (remotePalace) await repo.upsertMany([remotePalace], { pruneMissingOfficial: false });
    await locationRepo.upsertMany(remoteLocations ?? [], {
      pruneMissingSynced: true,
      palaceId: id,
    });
  } catch (error) {
    console.warn('Failed to sync palace details, using local data:', error);
  }

  const resolvedPalace = await repo.getById(id);
  if (!resolvedPalace) return undefined;
  return applyOfflineLockState(resolvedPalace, localUserAccess);
}

export async function createPalace(palace: Partial<Palace>): Promise<Palace> {
  const id = await repo.save(palace);
  const created = await repo.getById(id);
  if (!created) throw new Error('Failed to create palace');
  return created;
}

export async function updatePalace(id: string, palace: Partial<Palace>): Promise<Palace> {
  await repo.save({ ...palace, id });
  const updated = await repo.getById(id);
  if (!updated) throw new Error('Failed to update palace');
  return updated;
}

export async function deletePalace(id: string): Promise<boolean> {
  await repo.delete(id);
  return true;
}

export async function unlockPalace(palaceId: string): Promise<boolean> {
  return palaceApi.unlockPalace(palaceId);
}
