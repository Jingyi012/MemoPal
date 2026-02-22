export const masteryProgressMap = {
  new: { base: 0, increment: 0.2 }, // fast growth at the start
  learning: { base: 0.3, increment: 0.1 }, // moderate growth
  reviewing: { base: 0.4, increment: 0.15 }, // slower growth
  mastered: { base: 1, increment: 0 }, // fixed at 1
} as const;

export const calculateDetailedProgress = (
  level: keyof typeof masteryProgressMap,
  totalReviews: number
): number => {
  if (level === 'mastered') return 1;

  const { base, increment } = masteryProgressMap[level] || { base: 0, increment: 0 };

  // Each review adds increment, but capped at 1
  const total = base + totalReviews * increment;

  return Math.min(total, 1);
};
