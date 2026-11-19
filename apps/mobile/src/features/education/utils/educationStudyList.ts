export function parseEducationStudyList(text: string): { text: string; meaning: string | null }[] {
  return text.split(/\r?\n/).filter(line => line.trim()).map(line => {
    // Explicit separators only: spaces and hyphens can belong to a word or sentence.
    const separator = /\t|\s*[|｜=＝：]\s*|:\s+/.exec(line);
    const word = separator ? line.slice(0, separator.index) : line;
    const meaning = separator ? line.slice(separator.index + separator[0].length).replace(/\t/g, ' ') : '';
    return { text: word.normalize('NFC').trim(), meaning: meaning.normalize('NFC').trim() || null };
  });
}
export function isValidEducationStudyList(entries: ReturnType<typeof parseEducationStudyList>): boolean {
  return entries.length > 0 && entries.length <= 50 && entries.every(entry => !!entry.text && [...entry.text].length <= 500 && [...(entry.meaning ?? '')].length <= 500)
    && new Set(entries.map(entry => entry.text.toLocaleLowerCase())).size === entries.length;
}

/** Matches the API: null keeps the entire list together; explicit sizes split units. */
export function groupEducationStudyList<T>(entries: readonly T[], groupSize: number | null): T[][] {
  if (groupSize !== null && (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 50)) return [];
  const size = groupSize ?? Math.max(1, entries.length);
  return Array.from({ length: Math.ceil(entries.length / size) }, (_, index) => entries.slice(index * size, (index + 1) * size));
}
