import type { MemoryGoalType } from '@/features/memory-sets';

export type TechniqueChoice = 'palace' | 'number-peg';

export function recommendTechnique(goalType: MemoryGoalType, itemCount: number): TechniqueChoice {
  if (itemCount > 10 || goalType === 'facts') return 'palace';
  return 'number-peg';
}

export function buildTechniqueRoute(
  technique: TechniqueChoice,
  title: string,
  goalType: MemoryGoalType,
  items: string[],
) {
  const path = technique === 'palace' ? '/palaces/create-memory' : '/number-peg/create';
  return `${path}?title=${encodeURIComponent(title)}&goalType=${encodeURIComponent(goalType)}&items=${encodeURIComponent(JSON.stringify(items))}`;
}
