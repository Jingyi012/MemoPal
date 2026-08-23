import type { MemoryModuleDefinition } from '@/core/memory/memory-module';

export const palaceModule = {
  key: 'palace',
  title: 'Memory Palace',
  description: 'Learn with guided locations and visual memory journeys.',
  route: '/palaces',
  capabilities: {
    supportsCustomContent: true,
    supportsReview: true,
  },
} satisfies MemoryModuleDefinition;
