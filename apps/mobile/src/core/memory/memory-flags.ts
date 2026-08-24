import type { MemoryMethod, MemoryModuleFlags } from './memory.types';

export const DEFAULT_MEMORY_MODULE_FLAGS: MemoryModuleFlags = {
  palace: true,
  'number-peg': true,
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

/**
 * Resolve build-time flags for local development and simple staged releases.
 * Runtime/backend overrides can be merged here later without changing callers.
 */
export function getMemoryModuleFlags(): MemoryModuleFlags {
  return {
    palace: parseBoolean(
      process.env.EXPO_PUBLIC_ENABLE_PALACE,
      DEFAULT_MEMORY_MODULE_FLAGS.palace
    ),
    'number-peg': parseBoolean(
      process.env.EXPO_PUBLIC_ENABLE_NUMBER_PEG,
      DEFAULT_MEMORY_MODULE_FLAGS['number-peg']
    ),
  };
}

export function isMemoryModuleEnabled(
  method: MemoryMethod,
  flags: MemoryModuleFlags = getMemoryModuleFlags()
): boolean {
  return flags[method];
}
