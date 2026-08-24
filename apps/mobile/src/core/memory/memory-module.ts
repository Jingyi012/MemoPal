import type { MemoryMethod, MemoryMethodCapabilities } from '@/core/memory/memory.types';

export type MemoryModuleRoute = `/${string}`;

export type MemoryModuleDefinition = {
  key: MemoryMethod;
  title: string;
  description: string;
  route: MemoryModuleRoute;
  capabilities: MemoryMethodCapabilities;
};
