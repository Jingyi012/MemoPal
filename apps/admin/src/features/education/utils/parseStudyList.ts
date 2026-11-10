/** Tab-separated word/meaning pairs also paste directly from spreadsheet columns. */
export function parseStudyList(text: string): { text: string; meaning: string | null }[] {
  return text.split(/\r?\n/).filter(line => line.trim()).map(line => {
    const [word, ...meaning] = line.split('\t');
    return { text: word.normalize('NFC').trim(), meaning: meaning.join(' ').normalize('NFC').trim() || null };
  });
}
