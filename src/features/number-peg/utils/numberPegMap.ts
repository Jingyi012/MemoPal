import type { NumberPegItem, PegNumber } from '@/features/number-peg/types/numberPeg.types';

const PEG_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const satisfies readonly PegNumber[];

export const numberPegMap: Record<PegNumber, Omit<NumberPegItem, 'id' | 'number'>> = {
  0: {
    keyword: 'sun',
    image: 'sun',
    description: 'A bright sun represents zero and a fresh start.',
  },
  1: {
    keyword: 'candle',
    image: 'candle',
    description: 'A candle stands tall like a straight line.',
  },
  2: { keyword: 'swan', image: 'swan', description: 'A swan curves like the number 2.' },
  3: { keyword: 'heart', image: 'heart', description: 'A heart is a classic 3-shaped symbol.' },
  4: { keyword: 'chair', image: 'chair', description: 'A chair has four legs.' },
  5: { keyword: 'hook', image: 'hook', description: 'A hook curves like a 5.' },
  6: { keyword: 'guitar', image: 'guitar', description: 'A guitar body resembles a 6.' },
  7: {
    keyword: 'hooked-stick',
    image: 'hooked-stick',
    description: 'A long hook and a line make a 7.',
  },
  8: { keyword: 'snowman', image: 'snowman', description: 'Two circles make the classic 8 shape.' },
  9: { keyword: 'balloon', image: 'balloon', description: 'A balloon floats and curves like a 9.' },
};

export function buildNumberPegItems(): NumberPegItem[] {
  return PEG_NUMBERS.map((number) => ({
    id: `peg-${number}`,
    number,
    ...numberPegMap[number],
  }));
}
