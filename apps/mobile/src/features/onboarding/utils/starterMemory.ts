import type { PredefinedMemoryLesson } from '../../predefined-memory-lessons/types/predefinedMemoryLesson.types';

export function getStarterLessons(lessons: PredefinedMemoryLesson[]) {
  return lessons.filter((lesson) => lesson.isPublished && lesson.category.isActive &&
    lesson.isStarterLesson && lesson.techniqueKey === 'number-peg' &&
    lesson.items.length >= 2 && lesson.items.length <= 5)
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.sortOrder - b.sortOrder);
}

export function localizeStarterLesson(lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  return {
    title: language === 'zh' ? lesson.titleZh : lesson.titleEn,
    description: language === 'zh' ? lesson.descriptionZh : lesson.descriptionEn,
    items: [...lesson.items].sort((a, b) => a.position - b.position)
      .map((item) => language === 'zh' ? item.contentZh : item.contentEn),
  };
}

export function starterMemoryParams(lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  const localized = localizeStarterLesson(lesson, language);
  return { title: localized.title, items: JSON.stringify(localized.items),
    goalType: lesson.goalType, onboardingLessonId: lesson.id, guidedStarter: '1' };
}
