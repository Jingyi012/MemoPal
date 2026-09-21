import type { PredefinedMemoryLesson, PredefinedMemoryLessonItem } from '../types/predefinedMemoryLesson.types';

export type LessonLanguage = 'en' | 'zh';

export function localizePredefinedMemoryLessonItem(item: PredefinedMemoryLessonItem, language: LessonLanguage) {
  return {
    content: language === 'zh' ? item.contentZh : item.contentEn,
    association: (language === 'zh' ? item.associationZh : item.associationEn) ?? '',
  };
}

export function findPredefinedMemoryLessonItem(
  lesson: PredefinedMemoryLesson | undefined,
  answer: string,
  index: number,
  language: LessonLanguage,
) {
  if (!lesson) return undefined;
  const localized = lesson.items
    .slice()
    .sort((left, right) => left.position - right.position);
  return localized.find((item) => localizePredefinedMemoryLessonItem(item, language).content === answer)
    ?? localized[index];
}
