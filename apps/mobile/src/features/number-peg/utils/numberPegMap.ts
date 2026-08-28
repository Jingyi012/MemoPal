import type { NumberPegItem, PegNumber } from '@/features/number-peg/types/numberPeg.types';

const PEG_NUMBERS = Array.from({ length: 100 }, (_, index) => index + 1) as PegNumber[];
export const MAX_NUMBER_PEGS = 100;

export function getUnlockedPegCount(level: number): number {
  return Math.min(MAX_NUMBER_PEGS, Math.max(1, Math.floor(level)) * 10);
}

const starterPegMap: Record<number, Omit<NumberPegItem, 'id' | 'number'>> = {
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

const EXTENDED_PEG_DEFINITIONS: readonly (readonly [string, string])[] = [
  ['Candle', '🕯️'], ['Swan', '🦢'], ['Heart', '❤️'], ['Sailboat', '⛵'], ['Hand', '✋'],
  ['Elephant', '🐘'], ['Rainbow', '🌈'], ['Snowman', '⛄'], ['Balloon', '🎈'], ['Hat', '🎩'],
  ['Cane', '🦯'], ['Socks', '🧦'], ['Kite', '🪁'], ['Ice cube', '🧊'], ['Door', '🚪'],
  ['Drum', '🥁'], ['Magic wand', '🪄'], ['Trumpet', '🎺'], ['Thread', '🧵'], ['Bell', '🔔'],
  ['Sun', '☀️'], ['Shoes', '👟'], ['Tree', '🌳'], ['Chair', '🪑'], ['Beehive', '🐝'],
  ['Sticks', '🪵'], ['Cloud', '☁️'], ['Gate', '🚧'], ['Wine', '🍷'], ['Dirt', '🪨'],
  ['Bun', '🍞'], ['Moon', '🌙'], ['Butterfly', '🦋'], ['Fork', '🍴'], ['Crown', '👑'],
  ['Brick', '🧱'], ['Dice', '🎲'], ['Plate', '🍽️'], ['Vine', '🌿'], ['Rose', '🌹'],
  ['Rocket', '🚀'], ['Feather', '🪶'], ['Flag', '🚩'], ['Window', '🪟'], ['Star', '⭐'],
  ['Guitar', '🎸'], ['Globe', '🌍'], ['Snowflake', '❄️'], ['Key', '🔑'], ['Coins', '🪙'],
  ['Hook', '🪝'], ['Deck of cards', '🃏'], ['Ladder', '🪜'], ['Lightning', '⚡'], ['Gloves', '🧤'],
  ['Shell', '🐚'], ['Clover', '🍀'], ['Octopus', '🐙'], ['Whistle', '📣'], ['Clock', '🕰️'],
  ['Pencil', '✏️'], ['Dragon', '🐉'], ['Mountain', '⛰️'], ['Camera', '📷'], ['Castle', '🏰'],
  ['Magnet', '🧲'], ['Wizard', '🧙'], ['Bicycle', '🚲'], ['Fire', '🔥'], ['Bucket', '🪣'],
  ['Compass', '🧭'], ['Pyramid', '🔺'], ['Robot', '🤖'], ['Tractor', '🚜'], ['Cake', '🎂'],
  ['Anchor', '⚓'], ['Fireworks', '🎆'], ['Puzzle', '🧩'], ['Sunflower', '🌻'], ['Apple', '🍎'],
  ['Watermelon', '🍉'], ['Drumstick', '🍗'], ['Diamond', '💎'], ['Parrot', '🦜'], ['Train', '🚂'],
  ['Mermaid', '🧜'], ['Spider', '🕷️'], ['Volcano', '🌋'], ['Trophy', '🏆'], ['Satellite', '🛰️'],
  ['Dinosaur', '🦖'], ['Lighthouse', '🗼'], ['Pizza', '🍕'], ['Skateboard', '🛹'], ['Whale', '🐋'],
  ['Unicorn', '🦄'], ['Crown jewel', '💠'], ['Jackpot', '🎰'], ['Treasure chest', '🧰'], ['World map', '🗺️'],
] as const;

/** Mutable runtime overrides loaded from the admin-managed system setting. */
export const numberPegMap = starterPegMap as Record<number, Omit<NumberPegItem, 'id' | 'number'>>;

export function applyNumberPegDefinitions(value: unknown): void {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>).pegs
    : value;
  if (!Array.isArray(source)) return;

  for (const item of source) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const number = Number(entry.number);
    const keyword = String(entry.name ?? entry.keyword ?? '').trim();
    const image = String(entry.icon ?? entry.image ?? '').trim();
    const description = String(entry.description ?? '').trim();
    if (!Number.isInteger(number) || number < 1 || number > MAX_NUMBER_PEGS || !keyword || !image || !description) continue;
    numberPegMap[number] = { keyword, image, description };
  }
}

export function getNumberPegDefinition(number: PegNumber): Omit<NumberPegItem, 'id' | 'number'> {
  if (numberPegMap[number]) return numberPegMap[number];
  const extended = EXTENDED_PEG_DEFINITIONS[number - 1];
  if (extended) {
    return {
      keyword: extended[0],
      image: extended[1],
      description: `Picture a ${extended[0].toLowerCase()} as your fixed image for number ${number}.`,
    };
  }
  return { keyword: `Peg ${number}`, image: '🔢', description: `Create a vivid image for number ${number}.` };
}

export function buildAllNumberPegItems(): NumberPegItem[] {
  return PEG_NUMBERS.map((number) => ({
    id: `peg-${number}`,
    number,
    ...getNumberPegDefinition(number),
  }));
}

/** The familiarity lesson starts with the ten beginner anchors. */
export function buildNumberPegItems(): NumberPegItem[] {
  return buildAllNumberPegItems().slice(0, 10);
}

const SCENE_ACTIONS = [
  'launches it through a shower of glitter',
  'wears it as an enormous wobbly hat',
  'chases it while it sings at full volume',
  'juggles it above a fizzy purple volcano',
] as const;

export function buildPegScene(pegNumber: PegNumber, answer: string, variant = 0) {
  const peg = getNumberPegDefinition(pegNumber);
  const action = SCENE_ACTIONS[Math.abs(variant) % SCENE_ACTIONS.length];
  return `The ${peg.keyword.toLowerCase()} ${action}: ${answer.trim()}.`;
}
