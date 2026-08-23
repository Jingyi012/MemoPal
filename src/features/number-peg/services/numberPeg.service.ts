import { buildNumberPegItems } from '@/features/number-peg/utils/numberPegMap';
import type { NumberPegItem } from '@/features/number-peg/types/numberPeg.types';

export type NumberPegOverview = {
  title: string;
  description: string;
  items: NumberPegItem[];
};

/**
 * Application-level view model for the introductory number-peg experience.
 * This keeps screen components independent from the peg catalogue source.
 */
export function getNumberPegOverview(): NumberPegOverview {
  return {
    title: 'Number Peg',
    description:
      'Learn the 0–9 peg system, then attach spelling words or shopping items to memorable cues.',
    items: buildNumberPegItems(),
  };
}
