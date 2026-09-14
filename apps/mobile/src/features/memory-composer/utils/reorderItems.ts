export function reorderItems<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return [...items];
  }

  const reordered = [...items];
  const [movedItem] = reordered.splice(from, 1);
  reordered.splice(to, 0, movedItem);
  return reordered;
}
