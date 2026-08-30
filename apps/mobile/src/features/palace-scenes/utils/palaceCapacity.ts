import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';

export function getPalaceLoci(scene: PalaceScene | undefined) {
  return scene?.loci.slice().sort((a, b) => a.position - b.position) ?? [];
}

export function getPalaceCapacity(scene: PalaceScene | undefined) {
  return scene?.loci.length ?? 0;
}

/**
 * Pick the smallest scene that can hold the list. When no scene can hold it,
 * keep the largest scene selected so the user gets an actionable capacity
 * message instead of an invalid handoff.
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
  if (fitting[0]) return fitting[0];

  return scenes
    .slice()
    .sort((a, b) => getPalaceCapacity(b) - getPalaceCapacity(a))[0];
}

export function getPalaceCapacityMessage(itemCount: number, capacity: number) {
  if (itemCount <= capacity) return null;

  const overflow = itemCount - capacity;
  return `This list has ${itemCount} items, but the largest available Palace has ${capacity} loci. Remove ${overflow} item${overflow === 1 ? '' : 's'} or create a second memory.`;
}

export function sceneFitsPalaceItems(scene: PalaceScene, itemCount: number) {
  return getPalaceCapacity(scene) >= itemCount;
}
