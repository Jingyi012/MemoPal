import type { MemoryTechniqueKey } from './types/memorySet.types';

export const MEMORY_SET_KEYS = {
  all: ['memory-sets'] as const,
  lists: () => [...MEMORY_SET_KEYS.all, 'list'] as const,
  list: (techniqueKey?: MemoryTechniqueKey) =>
    [...MEMORY_SET_KEYS.lists(), techniqueKey ?? 'all'] as const,
  details: () => [...MEMORY_SET_KEYS.all, 'detail'] as const,
  detail: (memorySetId: string) => [...MEMORY_SET_KEYS.details(), memorySetId] as const,
};
