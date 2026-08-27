import { buildAllNumberPegItems } from '@/features/number-peg/utils/numberPegMap';
import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';

export type NumberPegOverview = {
  title: string;
  description: string;
  items: NumberPegItem[];
};

/** Keeps the screen independent from the peg catalogue source. */
export function getNumberPegOverview(): NumberPegOverview {
  return {
    title: 'Number Peg',
    description:
      'Learn ten starter pegs, then unlock the full 1–100 set as your memory practice grows.',
    items: buildAllNumberPegItems(),
  };
}
