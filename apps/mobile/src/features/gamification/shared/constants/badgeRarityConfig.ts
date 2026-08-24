import { Colors } from '@/constants/colors';

export const BADGE_RARITY_CONFIG = {
  common: {
    label: 'Common',
    gradient: [Colors.blue400, Colors.blue600],
    glow: false,
  },
  rare: {
    label: 'Rare',
    gradient: [Colors.orange400, Colors.orange600],
    glow: false,
  },
  epic: {
    label: 'Epic',
    gradient: [Colors.purple400, Colors.purple600],
    glow: true,
  },
  legendary: {
    label: 'Legendary',
    gradient: [Colors.yellow400, Colors.yellow600],
    glow: true,
  },
} as const;

export const LOCKED_BADGE_GRADIENT = [Colors.slate400, Colors.slate500];
