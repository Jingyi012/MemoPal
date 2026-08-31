import type { MemoryGoalType } from '@/features/memory-sets';

export type TechniqueChoice = 'palace' | 'number-peg';
export type ComposerOrigin = 'global' | 'palace';

export function recommendTechnique(goalType: MemoryGoalType, itemCount: number): TechniqueChoice {
  if (itemCount > 10 || goalType === 'facts') return 'palace';
  return 'number-peg';
}

export function buildTechniqueRoute(
  technique: TechniqueChoice,
  title: string,
  goalType: MemoryGoalType,
  items: string[],
  sceneId?: string,
  origin: ComposerOrigin = 'global',
) {
  const path = technique === 'palace' ? '/palaces/build' : '/number-peg/build';
  const sceneParam = technique === 'palace' && sceneId ? `&sceneId=${encodeURIComponent(sceneId)}` : '';
  const originParam = technique === 'palace' ? `&origin=${origin}` : '';
  return `${path}?title=${encodeURIComponent(title)}&goalType=${encodeURIComponent(goalType)}&items=${encodeURIComponent(JSON.stringify(items))}${sceneParam}${originParam}`;
}
