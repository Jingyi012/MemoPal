import { describe, expect, it } from 'vitest';
import { parseStudyList } from './parseStudyList';

describe('word list import', () => {
  it('preserves punctuation in words and supports pasted spreadsheet pairs', () => {
    expect(parseStudyList("ice-cream\t冰淇淋\r\nHello, world!\t问候语\n\nbook")).toEqual([
      { text: 'ice-cream', meaning: '冰淇淋' }, { text: 'Hello, world!', meaning: '问候语' }, { text: 'book', meaning: null },
    ]);
  });
  it('keeps duplicate and missing words visible for validation instead of silently discarding them', () => {
    expect(parseStudyList(' book \t书\nbook\t图书\n\tmissing word')).toEqual([
      { text: 'book', meaning: '书' }, { text: 'book', meaning: '图书' }, { text: '', meaning: 'missing word' },
    ]);
  });
});
