export function reorderEducationOptionIds(ids: readonly string[], index: number, offset: -1 | 1): string[] {
  const target = index + offset;
  if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return [...ids];
  const reordered = [...ids];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}
