import { useMemo } from 'react';
import {
  canAccessMemoryModule,
  listEnabledMemoryModules,
} from './memory-access';
import { getMemoryModuleFlags } from './memory-flags';
import type { MemoryMethod } from './memory.types';

export function useMemoryModuleFlags() {
  return useMemo(() => getMemoryModuleFlags(), []);
}

export function useMemoryModuleAccess(method: MemoryMethod) {
  const flags = useMemoryModuleFlags();

  return {
    enabled: canAccessMemoryModule(method, flags),
    isLoading: false,
  };
}

export function useEnabledMemoryModules() {
  const flags = useMemoryModuleFlags();
  return useMemo(() => listEnabledMemoryModules(flags), [flags]);
}
