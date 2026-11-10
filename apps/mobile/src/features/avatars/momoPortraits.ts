import type { ImageSourcePropType } from 'react-native';

const portraits: readonly ImageSourcePropType[] = [
  require('../../../assets/images/momo-levels/level-01-v2.webp'),
  require('../../../assets/images/momo-levels/level-02-v2.webp'),
  require('../../../assets/images/momo-levels/level-03-v2.webp'),
  require('../../../assets/images/momo-levels/level-04-v2.webp'),
  require('../../../assets/images/momo-levels/level-05-v2.webp'),
  require('../../../assets/images/momo-levels/level-06-v2.webp'),
  require('../../../assets/images/momo-levels/level-07-v2.webp'),
  require('../../../assets/images/momo-levels/level-08-v2.webp'),
  require('../../../assets/images/momo-levels/level-09-v2.webp'),
  require('../../../assets/images/momo-levels/level-10-v2.webp'),
];

const swimWings: readonly ImageSourcePropType[] = [
  require('../../../assets/images/momo-levels/level-01-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-02-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-03-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-04-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-05-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-06-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-07-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-08-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-09-v2-wing.webp'),
  require('../../../assets/images/momo-levels/level-10-v2-wing.webp'),
];

const encourageReactions: readonly ImageSourcePropType[] = [
  require('../../../assets/images/momo-levels/level-01-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-02-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-03-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-04-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-05-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-06-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-07-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-08-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-09-v2-encourage.webp'),
  require('../../../assets/images/momo-levels/level-10-v2-encourage.webp'),
];

const helloReactions: readonly ImageSourcePropType[] = [
  require('../../../assets/images/momo-levels/level-01-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-02-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-03-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-04-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-05-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-06-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-07-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-08-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-09-v2-hello.webp'),
  require('../../../assets/images/momo-levels/level-10-v2-hello.webp'),
];

const thinkReactions: readonly ImageSourcePropType[] = [
  require('../../../assets/images/momo-levels/level-01-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-02-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-03-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-04-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-05-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-06-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-07-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-08-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-09-v2-think.webp'),
  require('../../../assets/images/momo-levels/level-10-v2-think.webp'),
];

const celebrateReactions: readonly ImageSourcePropType[] = [
  require('../../../assets/images/momo-levels/level-01-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-02-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-03-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-04-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-05-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-06-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-07-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-08-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-09-v2-celebrate.webp'),
  require('../../../assets/images/momo-levels/level-10-v2-celebrate.webp'),
];

// A single drawing scale is shared by swimming and reactions so a level change
// reads as physical growth, even when the actor's layout box stays fixed.
const growthScales = [.62, .68, .74, .78, .82, .86, .9, .94, .97, 1] as const;

const safeIndex = (level: number) => Number.isFinite(level)
  ? Math.max(0, Math.min(9, Math.floor(level) - 1))
  : 0;

export function isMomoPortrait(key: string) {
  return /^momo-(0[1-9]|10)$/.test(key);
}

export function momoPortraitForKey(key: string | null | undefined) {
  if (!key || !isMomoPortrait(key)) return null;
  return portraits[Number(key.slice(-2)) - 1];
}

export function momoPortraitForLevel(level: number) {
  return portraits[safeIndex(level)];
}

export function momoReactionForLevel(level: number, reaction: 'hello' | 'correct' | 'encourage' | 'think' | 'celebrate') {
  const sprites = reaction === 'hello' ? helloReactions
    : reaction === 'encourage' ? encourageReactions
    : reaction === 'think' ? thinkReactions : celebrateReactions;
  return sprites[safeIndex(level)];
}

export function momoGrowthScaleForLevel(level: number) {
  return growthScales[safeIndex(level)];
}

export function momoSwimWingForLevel(level: number) {
  return swimWings[safeIndex(level)];
}
