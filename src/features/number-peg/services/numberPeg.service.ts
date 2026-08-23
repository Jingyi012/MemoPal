import { buildNumberPegItems } from '@/features/number-peg/utils/numberPegMap';
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
      'Learn the 1–10 peg system, then attach spelling words or shopping items to memorable cues.',
    items: buildNumberPegItems(),
  };
}
