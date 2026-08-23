import { numberPegModule } from '@/features/number-peg/number-peg.module';
import { palaceModule } from '@/features/palace/palace.module';
import type { MemoryMethod } from './memory.types';
import type { MemoryModuleDefinition } from './memory-module';

/**
 * Composition point for memory methods supported by the app.
 *
 * The registry contains metadata and capabilities only. Method-specific
 * business rules, persistence, and UI remain inside their feature folders.
 */
export const memoryModuleRegistry = {
  palace: palaceModule,
  'number-peg': numberPegModule,
} satisfies Record<MemoryMethod, MemoryModuleDefinition>;

export function getMemoryModule(method: MemoryMethod): MemoryModuleDefinition {
  return memoryModuleRegistry[method];
}

export function listMemoryModules(): MemoryModuleDefinition[] {
  return Object.values(memoryModuleRegistry);
}
