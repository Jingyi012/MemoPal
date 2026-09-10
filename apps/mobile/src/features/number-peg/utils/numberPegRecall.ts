/** Save this order with the session so resuming never changes the next question. */
export function createNumberPegRecallOrder(
  items: readonly { id: string }[],
  ordered: boolean,
  random: () => number = Math.random
) {
  const ids = items.map((item) => item.id);
  if (!ordered) {
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
  }
  return ids;
}

export function restoreNumberPegRecallOrder(items: readonly { id: string }[], saved?: string[]) {
  const valid = new Set(items.map((item) => item.id));
  return saved?.length === items.length &&
    new Set(saved).size === items.length &&
    saved.every((id) => valid.has(id))
    ? saved
    : items.map((item) => item.id);
}
