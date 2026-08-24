import type { MemoryGoalType } from '@/features/memory-sets';

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseComposerItems(value: string | string[] | undefined): string[] {
  const raw = firstParam(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}

export function parseComposerGoal(value: string | string[] | undefined): MemoryGoalType {
  const goal = firstParam(value);
  return goal === 'spelling' || goal === 'ordered-list' || goal === 'facts' || goal === 'names' || goal === 'custom'
    ? goal
    : 'spelling';
}

export function suggestMemoryTitle(goalType: MemoryGoalType, items: string[]): string {
  const labels: Record<MemoryGoalType, string> = {
    spelling: 'Spelling practice',
    'ordered-list': 'Memory list',
    facts: 'Facts to remember',
    names: 'Names to remember',
    custom: 'New memory',
  };
  const firstItem = items.find((item) => item.trim())?.trim();
  if (!firstItem) return labels[goalType];
  const preview = firstItem.length > 28 ? `${firstItem.slice(0, 28).trimEnd()}…` : firstItem;
  const remaining = Math.max(0, items.filter((item) => item.trim()).length - 1);
  return `${labels[goalType]} · ${preview}${remaining ? ` + ${remaining} more` : ''}`;
}
