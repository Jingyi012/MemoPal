import type { PredefinedMemoryLesson } from '../types/predefinedMemoryLesson.types';

export function predefinedLessonRoute(lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  return {
    pathname: lesson.techniqueKey === 'palace' ? '/palaces/create-memory' : '/number-peg/create',
    params: {
      predefinedLessonId: lesson.id,
      title: language === 'zh' ? lesson.titleZh : lesson.titleEn,
      emoji: lesson.emoji,
      goalType: lesson.goalType,
      items: JSON.stringify(lesson.items.slice().sort((a, b) => a.position - b.position)
        .map((item) => language === 'zh' ? item.contentZh : item.contentEn)),
      ...(lesson.techniqueKey === 'palace' && lesson.palaceSceneId ? { sceneId: lesson.palaceSceneId } : {}),
    },
  };
}
