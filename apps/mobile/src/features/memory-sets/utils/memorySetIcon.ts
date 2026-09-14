import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { getNumberPegDefinition } from '@/features/number-peg/utils/numberPegMap';

/** Returns the visual anchor used for a memory set's number peg icon. */
export function getMemorySetPegIcon(memorySet: MemorySet): string {
  const itemPositions = new Map(memorySet.items.map((item) => [item.id, item.position]));
  const binding = memorySet.techniquePlan?.pegBindings
    .slice()
    .sort((left, right) => (itemPositions.get(left.memoryItemId) ?? Infinity) - (itemPositions.get(right.memoryItemId) ?? Infinity))[0];

  if (binding) {
    const savedIcon = binding.sceneRecipe?.anchorSnapshot?.image.trim();
    return savedIcon || getNumberPegDefinition(binding.pegNumber).image;
  }

  const firstAnswer = memorySet.items
    .slice()
    .sort((left, right) => left.position - right.position)[0]?.answer.trim();
  return firstAnswer ? Array.from(firstAnswer)[0].toUpperCase() : '🕯️';
}
