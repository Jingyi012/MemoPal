import type { EducationPublicCourseSummary } from '../types/educationPractice.types';

export const learningPreferenceChoices = {
  subject: ['all', 'chinese', 'english', 'math', 'science'],
  stage: ['all', 'early-primary', 'upper-primary', 'secondary', 'general'],
  language: ['all', 'zh-Hans', 'en', 'ms'],
} as const;
export type LearningPreferences = { [K in keyof typeof learningPreferenceChoices]: typeof learningPreferenceChoices[K][number] };
export const defaultLearningPreferences: LearningPreferences = { subject: 'all', stage: 'all', language: 'all' };

export function parseLearningPreferences(raw: string | null): LearningPreferences | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Record<string, unknown>;
    if (!Object.entries(learningPreferenceChoices).every(([key, choices]) =>
      typeof value[key] === 'string' && (choices as readonly string[]).includes(value[key] as string))) return null;
    return { subject: value.subject, stage: value.stage, language: value.language } as LearningPreferences;
  } catch { return null; }
}

/** Recommendations never hide the catalog or change a learner's active course. */
export function recommendFirstCourse(courses: readonly EducationPublicCourseSummary[], preferences: LearningPreferences | null) {
  const matches = courses.filter(course => !preferences || (
    (preferences.subject === 'all' || course.subjectCode === preferences.subject)
    && (preferences.stage === 'all' || course.learningStage === preferences.stage)
    && (preferences.language === 'all' || course.languageCode === preferences.language)
  ));
  const course = matches.find(item => item.isMemoPalStarter) ?? matches[0]
    ?? courses.find(item => item.isMemoPalStarter) ?? courses[0];
  return { course, isFallback: !!course && matches.length === 0 };
}
