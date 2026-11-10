export type LearningSubject = 'chinese' | 'english' | 'math' | 'science' | 'other';
export type CourseAudienceFilter = { stage: string; language: string };
export const emptyCourseAudience: CourseAudienceFilter = { stage: 'all', language: 'all' };

export function matchesCourseAudience(course: { learningStage?: string | null; languageCode?: string | null }, filter: CourseAudienceFilter) {
  return (filter.stage === 'all' || course.learningStage === filter.stage)
    && (filter.language === 'all' || course.languageCode === filter.language);
}

/** Explicit author metadata wins; title matching is only a legacy fallback. */
export function learningSubjectFor(title: string, subjectCode?: string | null): LearningSubject {
  if (subjectCode) return ['chinese', 'english', 'math', 'science'].includes(subjectCode) ? subjectCode as LearningSubject : 'other';
  if (/chinese|中文|华文|华语|语文/i.test(title)) return 'chinese';
  if (/science|科学|sains/i.test(title)) return 'science';
  if (/math|数学|matematik/i.test(title)) return 'math';
  if (/english|英语|英文/i.test(title)) return 'english';
  return 'other';
}

export function courseAudienceLabels(course: { learningStage?: string | null; languageCode?: string | null }, zh: boolean): string[] {
  const stages: Record<string, string> = zh
    ? { 'early-primary': '小学低年级', 'upper-primary': '小学高年级', secondary: '中学', general: '通用体验' }
    : { 'early-primary': 'Early primary', 'upper-primary': 'Upper primary', secondary: 'Secondary', general: 'General exploration' };
  const languages: Record<string, string> = zh ? { 'zh-Hans': '中文内容', en: '英文内容', ms: '马来语内容' } : { 'zh-Hans': 'Chinese content', en: 'English content', ms: 'Malay content' };
  return [stages[course.learningStage ?? ''], languages[course.languageCode ?? '']].filter(Boolean);
}
