import type { EducationGuidedCourseProgress, EducationGuidedLessonProgress, EducationPublicCourseDetail } from '../types/educationPractice.types';

/** Choose only within this objective; a course recommendation may belong elsewhere. */
export function chooseObjectiveLesson(objectiveId: string, progress?: EducationGuidedCourseProgress) {
  const lessons = progress?.lessons.filter(lesson => lesson.objectives.some(objective => objective.objectiveId === objectiveId)) ?? [];
  return lessons.find(lesson => lesson.assessmentId === progress?.nextRecommendedAssessmentId)
    ?? lessons.find(lesson => !lesson.isComplete)
    ?? lessons.find(lesson => lesson.latestIncorrectQuestionCount > 0)
    ?? lessons[0];
}

export function studyObjectivesForLesson(
  objectives: EducationPublicCourseDetail['objectives'],
  lesson: EducationGuidedLessonProgress | undefined,
  studiedObjectiveId?: string,
) {
  if (!lesson || lesson.isStarted) return [];
  return objectives.filter(objective => objective.id !== studiedObjectiveId
    && objective.studyItems.length > 0
    && lesson.objectives.some(item => item.objectiveId === objective.id)).map(objective => objective.id);
}
