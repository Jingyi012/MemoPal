export const PRACTICE_KEYS = {
  all: ['practice-attempts'] as const,
  stats: () => [...PRACTICE_KEYS.all, 'stats'] as const,
  due: () => [...PRACTICE_KEYS.all, 'due'] as const,
  upcoming: (days = 30) => [...PRACTICE_KEYS.all, 'upcoming', days] as const,
  history: (memorySetId: string) => [...PRACTICE_KEYS.all, 'history', memorySetId] as const,
  progress: (memorySetId: string) => [...PRACTICE_KEYS.all, 'progress', memorySetId] as const,
};
