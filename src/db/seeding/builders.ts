import type { PalaceSeed } from './catalog';
import { LESSON_SETS, LOCATION_NAMES_BY_THEME, TOPIC_POOL, WORD_BANK } from './catalog';

export function buildLocations(palace: PalaceSeed) {
  return LOCATION_NAMES_BY_THEME[palace.theme].map((name, index) => ({
    id: `${palace.id}-loc-${index + 1}`,
    palaceId: palace.id,
    position: index + 1,
    name,
    description: `${name} is location #${index + 1} in ${palace.name}.`,
    imageUrl: `https://picsum.photos/seed/${palace.id}-loc-${index + 1}/900/600`,
  }));
}

export function buildLessonBundles(palace: PalaceSeed) {
  const topics = TOPIC_POOL[palace.theme];
  const bank = WORD_BANK[palace.theme];
  const bundles: { lesson: any; words: any[] }[] = [];

  for (let loc = 1; loc <= 10; loc += 1) {
    for (let setIndex = 0; setIndex < LESSON_SETS.length; setIndex += 1) {
      const lessonIndex = (loc - 1) * LESSON_SETS.length + setIndex;
      const lessonId = `${palace.id}-lesson-${loc}-${setIndex + 1}`;
      const locationId = `${palace.id}-loc-${loc}`;
      const topic = topics[(loc - 1) % topics.length];
      const setLabel = LESSON_SETS[setIndex];

      const words = Array.from({ length: 10 }).map((__, wordIndex) => {
        const wordOffset = (lessonIndex * 10 + wordIndex) % bank.length;
        const base = bank[wordOffset];
        const displayText = `${base}_${loc}${setIndex + 1}${wordIndex + 1}`;

        return {
          id: `${lessonId}-word-${wordIndex + 1}`,
          lessonId,
          locationId,
          text: displayText,
          meaning: `${base} concept for ${topic.toLowerCase()} (${setLabel}, word ${wordIndex + 1})`,
        };
      });

      bundles.push({
        lesson: {
          id: lessonId,
          palaceId: palace.id,
          title: `${topic} • ${setLabel} • Loc ${loc}`,
          description: `Location ${loc} of ${palace.name}, ${setLabel}.`,
          wordCount: 10,
          category: 'vocabulary' as const,
          privacy: 'private' as const,
          isCustom: false,
          isLocked: palace.isLocked,
          isPremium: false,
          createdBy: null,
        },
        words,
      });
    }
  }

  return bundles;
}
