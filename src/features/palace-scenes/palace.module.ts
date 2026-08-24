import type { MemoryModuleDefinition } from '@/core/memory/memory-module';

export const palaceModule = {
  key: 'palace',
  title: 'Memory Palace',
  description: 'Place ideas on one visual scene, then recall them along a guided path.',
  route: '/palaces',
  capabilities: {
    supportsCustomContent: true,
    supportsReview: true,
  },
} satisfies MemoryModuleDefinition;
