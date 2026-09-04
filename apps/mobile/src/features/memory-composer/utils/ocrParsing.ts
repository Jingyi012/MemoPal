import type { RecognitionResult, TextLine } from 'expo-mlkit-ocr';

export const MAX_OCR_ITEMS = 100;

export type OcrItem = {
  value: string;
  needsReview: boolean;
};

/**
 * Converts OCR lines into memory items. We keep one visual line as one item so
 * phrases such as "water bottle" and "Kuala Lumpur" are not split blindly.
 * Number and bullet prefixes are removed, and duplicate lines are ignored.
 */
export function extractMemoryItems(result: RecognitionResult): OcrItem[] {
  const lines = result.blocks
    .flatMap((block) => block.lines ?? [])
    .map((line) => ({ line, text: cleanOcrLine(line.text) }))
    .filter(({ text }) => text.length > 0);

  const fallback = result.text
    .split(/\r?\n/)
    .map((text) => ({ line: null, text: cleanOcrLine(text) }))
    .filter(({ text }) => text.length > 0);
  const source = lines.length ? lines : fallback;
  const seen = new Set<string>();

  return source
    .sort((left, right) => compareOcrLines(left.line, right.line))
    .filter(({ text }) => {
      const key = text.normalize('NFKC').toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_OCR_ITEMS)
    .map(({ text }) => ({ value: text, needsReview: looksUncertain(text) }));
}

function cleanOcrLine(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/^[\s]*(?:(?:\d{1,3})[.)、:：]|[-*•▪◦])\s*/u, '')
    .replace(/[\t ]{2,}/g, ' ')
    .trim();
}

function compareOcrLines(left: TextLine | null, right: TextLine | null): number {
  if (!left || !right) return 0;
  const leftBox = left.boundingBox;
  const rightBox = right.boundingBox;
  const topDifference = leftBox.y - rightBox.y;
  // Lines on the same visual row should be read from left to right. The
  // tolerance prevents tiny OCR box differences from reordering a sentence.
  if (Math.abs(topDifference) > Math.max(leftBox.height, rightBox.height) * 0.65) {
    return topDifference;
  }
  return leftBox.x - rightBox.x;
}

function looksUncertain(value: string): boolean {
  // ML Kit does not expose a per-line confidence score. This catches the most
  // common OCR artifacts while leaving normal punctuation and CJK text alone.
  return /[�¦|]{1,}/u.test(value) || /[^\p{L}\p{N}\s'’.,!?&()/:;\-–—+%]/u.test(value);
}
