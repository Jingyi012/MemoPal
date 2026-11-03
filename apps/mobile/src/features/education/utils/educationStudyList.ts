export function parseEducationStudyList(text: string): { text: string; meaning: string | null }[] {
  return text.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const [word, ...meaning] = line.split('\t');
    return { text: word.normalize('NFC').trim(), meaning: meaning.join(' ').normalize('NFC').trim() || null };
  });
}
export function isValidEducationStudyList(entries: ReturnType<typeof parseEducationStudyList>): boolean {
  return entries.length > 0 && entries.length <= 50 && entries.every(entry => !!entry.text && [...entry.text].length <= 500 && [...(entry.meaning ?? '')].length <= 500)
    && new Set(entries.map(entry => entry.text.toLocaleLowerCase())).size === entries.length;
}
