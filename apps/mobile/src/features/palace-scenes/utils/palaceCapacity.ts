import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';

export function getPalaceLoci(scene: PalaceScene | undefined) {
  return scene?.loci.slice().sort((a, b) => a.position - b.position) ?? [];
}

export function getPalaceCapacity(scene: PalaceScene | undefined) {
  return scene?.loci.length ?? 0;
}

export function isPalaceSceneUnlocked(scene: PalaceScene, level: number, isPremium: boolean) {
  if (!scene.isTemplate) return true;
  return (scene.unlockLevel ?? 1) <= Math.max(1, Math.floor(level)) && (!scene.isPremium || isPremium);
}

export function getAvailablePalaceScenes(scenes: PalaceScene[], isPremium: boolean, level = 1) {
  return scenes.filter((scene) => isPalaceSceneUnlocked(scene, level, isPremium));
}

export function getPalaceCapacityShortfall(itemCount: number, capacity: number) {
  return Math.max(0, itemCount - capacity);
}

export function getLargestPalaceCapacity(scenes: PalaceScene[]) {
  return scenes.reduce((largest, scene) => Math.max(largest, getPalaceCapacity(scene)), 0);
}

/**
 * Pick the smallest scene that can hold the list. Return undefined when no
 * scene can hold it so callers never treat an insufficient scene as selected.
 */
export function choosePalaceScene(
  scenes: PalaceScene[],
  itemCount: number,
  requestedSceneId?: string,
) {
  if (!scenes.length) return undefined;

  const requested = scenes.find((scene) => scene.id === requestedSceneId);
  if (requested && getPalaceCapacity(requested) >= itemCount) return requested;

  const fitting = scenes
    .filter((scene) => getPalaceCapacity(scene) >= itemCount)
    .sort((a, b) => getPalaceCapacity(a) - getPalaceCapacity(b));
  return fitting[0];
}

export function getPalaceCapacityMessage(itemCount: number, capacity: number) {
  if (itemCount <= capacity) return null;

  const overflow = getPalaceCapacityShortfall(itemCount, capacity);
  return `This list has ${itemCount} items, but the largest available Palace has ${capacity} loci. Remove ${overflow} item${overflow === 1 ? '' : 's'} or create a second memory.`;
}

export function sceneFitsPalaceItems(scene: PalaceScene, itemCount: number) {
  return getPalaceCapacity(scene) >= itemCount;
}
