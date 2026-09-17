export const tours = {
  overview: ['practice', 'library', 'profile'],
  practicePage: ['practiceCreate'],
  libraryPage: ['libraryFilter', 'libraryStarter'],
  builder: ['builderScene', 'builderNext'],
  learn: ['sessionScene', 'sessionRecall'],
  recall: ['recallAnswer'],
} as const;
export const spotlightSteps = tours.overview;
export type TourScope = keyof typeof tours;
export type SpotlightTargetId = typeof tours[TourScope][number];
export type SpotlightRect = { x: number; y: number; width: number; height: number };

export function tourStorageKey(userId: string, scope: TourScope) {
  return `@memopal_spotlight_v2:${userId}:${scope}`;
}

export function spotlightCardPlacement(rect: SpotlightRect | null, height: number, topInset: number) {
  if (rect && rect.y + rect.height / 2 < height / 2) {
    return { top: Math.max(topInset + 12, rect.y + rect.height + 16), bottom: 16 };
  }
  return { top: topInset + 12, bottom: Math.max(16, rect ? height - rect.y + 16 : 100) };
}
