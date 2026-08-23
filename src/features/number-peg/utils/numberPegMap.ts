import type { NumberPegItem, PegNumber } from '@/features/number-peg/types/numberPeg.types';

const PEG_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const satisfies readonly PegNumber[];

export const numberPegMap: Record<PegNumber, Omit<NumberPegItem, 'id' | 'number'>> = {
  1: {
    keyword: 'Candle',
    image: '🕯️',
    description: 'A candle stands tall like a straight line.',
  },
  2: { keyword: 'Swan', image: '🦢', description: 'A swan curves like the number 2.' },
  3: { keyword: 'Heart', image: '❤️', description: 'A heart looks like two number 3 curves.' },
  4: { keyword: 'Sailboat', image: '⛵', description: 'A sail and mast trace the shape of 4.' },
  5: { keyword: 'Hand', image: '✋', description: 'Five fingers make the number instant.' },
  6: { keyword: 'Elephant', image: '🐘', description: 'A curled trunk sweeps like a 6.' },
  7: {
    keyword: 'Rainbow',
    image: '🌈',
    description: 'A rainbow is a lucky, colourful seven.',
  },
  8: { keyword: 'Snowman', image: '⛄', description: 'Two round snowballs form an 8.' },
  9: { keyword: 'Balloon', image: '🎈', description: 'A balloon and string curl like a 9.' },
  10: { keyword: 'Bat & ball', image: '🏏', description: 'A bat beside a ball makes 10.' },
};

export function buildNumberPegItems(): NumberPegItem[] {
  return PEG_NUMBERS.map((number) => ({
    id: `peg-${number}`,
    number,
    ...numberPegMap[number],
  }));
}

const SCENE_ACTIONS = [
  'launches it through a shower of glitter',
  'wears it as an enormous wobbly hat',
  'chases it while it sings at full volume',
  'juggles it above a fizzy purple volcano',
] as const;

export function buildPegScene(pegNumber: PegNumber, answer: string, variant = 0) {
  const peg = numberPegMap[pegNumber];
  const action = SCENE_ACTIONS[Math.abs(variant) % SCENE_ACTIONS.length];
  return `The ${peg.keyword.toLowerCase()} ${action}: ${answer.trim()}.`;
}
