import { communityApi, CommunityLessonQuery } from '@/api/community';
import { getFeatureLimits } from '@/services/featureLimits.service';
import { getLocationsByPalace } from '@/services/location.service';
import { createLesson } from '@/services/lesson.service';
import { syncLessonWords } from '@/services/word.service';
import { createLessonRepository } from '@/repositories/lesson.repo';
import { createUserRepository } from '@/repositories/user.repo';
import { CommunityLesson } from '@/types/community';

const lessonRepo = createLessonRepository();
const userRepo = createUserRepository();

export async function getCommunityLessons(query: CommunityLessonQuery = {}) {
  return await communityApi.getLessons(query);
}

export async function getMyCommunityLessons(query: CommunityLessonQuery = {}) {
  return await communityApi.getMyLessons(query);
}

export async function getCommunityLessonByShareCode(shareCode: string) {
  return await communityApi.getLessonByShareCode(shareCode);
}

export async function importCommunityLessonToPalace(params: {
  lesson: CommunityLesson;
  palaceId: string;
}) {
  const { lesson, palaceId } = params;

  const currentUser = await userRepo.getCurrent();
  if (currentUser) {
    const limits = await getFeatureLimits(currentUser.id, currentUser.isPremium);
    const currentLessons = await lessonRepo.getAllByPalace(palaceId);
    const currentCustomLessonsCount = currentLessons.filter((entry) => entry.isCustom !== false).length;

    if (currentCustomLessonsCount >= limits.customLessonsPerPalace) {
      throw new Error(
        `This palace already reached the custom lesson limit (${currentCustomLessonsCount}/${limits.customLessonsPerPalace}). Delete one lesson or choose another palace.`
      );
    }
  }

  const locations = await getLocationsByPalace(palaceId);
  const orderedLocations = locations
    .filter((location) => !location.isDeleted)
    .sort((a, b) => a.position - b.position);

  if (orderedLocations.length === 0) {
    throw new Error('Target palace has no locations. Add at least one location before import.');
  }

  if (lesson.words.length > orderedLocations.length) {
    throw new Error(
      `This lesson has ${lesson.words.length} words but the selected palace only has ${orderedLocations.length} locations. Add more locations or choose another palace.`
    );
  }

  const importedLessonId = await createLesson({
    palaceId,
    title: lesson.title.trim(),
    description: lesson.description?.trim() || 'Imported from community library',
    wordCount: lesson.words.length,
    category: lesson.category,
    tag: lesson.tags,
    isCustom: true,
    isLocked: false,
    isPremium: false,
    privacy: 'private',
    completed: false,
  });

  if (lesson.words.length > 0) {
    const wordsToImport = lesson.words.map((word, index) => {
      const location = orderedLocations[index];
      return {
        lessonId: importedLessonId,
        text: word.word,
        meaning: word.meaning,
        locationId: location.id,
      };
    });

    await syncLessonWords(importedLessonId, wordsToImport);
  }

  return importedLessonId;
}
