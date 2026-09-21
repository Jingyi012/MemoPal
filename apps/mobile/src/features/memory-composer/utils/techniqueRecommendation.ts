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
  memoryFolderId?: string,
  draft?: { memorySetId: string; expectedVersion: string; description?: string },
  predefinedLessonId?: string,
) {
  const path = technique === 'palace' ? '/palaces/build' : '/number-peg/build';
  const sceneParam = technique === 'palace' && sceneId ? `&sceneId=${encodeURIComponent(sceneId)}` : '';
  const originParam = technique === 'palace' ? `&origin=${origin}` : '';
  const folderParam = memoryFolderId ? `&memoryFolderId=${encodeURIComponent(memoryFolderId)}` : '';
  const draftParam = draft ? `&memorySetId=${encodeURIComponent(draft.memorySetId)}&expectedVersion=${encodeURIComponent(draft.expectedVersion)}&description=${encodeURIComponent(draft.description ?? '')}` : '';
  const lessonParam = predefinedLessonId ? `&predefinedLessonId=${encodeURIComponent(predefinedLessonId)}` : '';
  return `${path}?title=${encodeURIComponent(title)}&goalType=${encodeURIComponent(goalType)}&items=${encodeURIComponent(JSON.stringify(items))}${sceneParam}${originParam}${folderParam}${draftParam}${lessonParam}`;
}
