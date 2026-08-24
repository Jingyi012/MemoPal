import type { MemoryModuleDefinition } from '@/core/memory/memory-module';

export const numberPegModule = {
  key: 'number-peg',
  title: 'Number Peg',
  description: 'Attach words and lists to memorable number-based cues.',
  route: '/number-peg',
  capabilities: {
    supportsCustomContent: true,
    supportsReview: true,
  },
} satisfies MemoryModuleDefinition;
