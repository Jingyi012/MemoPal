import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';

type Translate = (key: any) => string;

const DEFAULT_KEYWORDS: Record<number, string> = {
  1: 'Candle',
  2: 'Swan',
  3: 'Heart',
  4: 'Sailboat',
  5: 'Hand',
  6: 'Elephant',
  7: 'Rainbow',
  8: 'Snowman',
  9: 'Balloon',
  10: 'Bat & ball',
};

/**
 * Localizes the authored starter anchors while leaving admin/custom anchor
 * definitions untouched. User-entered memory content is never translated.
 */
export function localizeNumberPeg(item: NumberPegItem, t: Translate): NumberPegItem {
  const defaultKeyword = DEFAULT_KEYWORDS[item.number];
  if (!defaultKeyword || item.keyword !== defaultKeyword) return item;

  const nameKey = `peg${item.number}Name`;
  const descriptionKey = `peg${item.number}Description`;
  const keyword = t(nameKey);
  const description = t(descriptionKey);
  return {
    ...item,
    keyword: keyword === nameKey ? item.keyword : keyword,
    description: description === descriptionKey ? item.description : description,
  };
}
