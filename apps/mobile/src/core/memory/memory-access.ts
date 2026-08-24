import { getMemoryModuleFlags, isMemoryModuleEnabled } from './memory-flags';
import { listMemoryModules } from './memory-registry';
import type { MemoryMethod, MemoryModuleFlags } from './memory.types';

export function listEnabledMemoryModules(
  flags: MemoryModuleFlags = getMemoryModuleFlags()
) {
  return listMemoryModules().filter((module) => isMemoryModuleEnabled(module.key, flags));
}

export function canAccessMemoryModule(
  method: MemoryMethod,
  flags: MemoryModuleFlags = getMemoryModuleFlags()
): boolean {
  return isMemoryModuleEnabled(method, flags);
}
