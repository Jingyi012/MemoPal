import type { PalaceSeed } from './catalog';
import { LESSON_LIBRARY, LOCATION_NAMES_BY_THEME } from './catalog';

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
  const lessons = LESSON_LIBRARY[palace.theme];

  return lessons.map((lessonSeed, lessonIndex) => {
    const lessonId = `${palace.id}-lesson-${lessonIndex + 1}`;
    const words = lessonSeed.words.map((word, wordIndex) => ({
      id: `${lessonId}-word-${wordIndex + 1}`,
      lessonId,
      locationId: `${palace.id}-loc-${wordIndex + 1}`,
      text: word.text,
      meaning: word.meaning,
    }));

    return {
      lesson: {
        id: lessonId,
        palaceId: palace.id,
        title: lessonSeed.title,
        description: lessonSeed.description,
        wordCount: 10,
        category: 'vocabulary' as const,
        privacy: 'private' as const,
        isCustom: false,
        isLocked: palace.isLocked,
        isPremium: false,
        createdBy: null,
      },
      words,
    };
  });
}
