export type LearningActivity = {
  courseId: string; source: 'personal' | 'public'; updatedAt: string;
  sectionId?: string; lessonId?: string; position?: number; finished?: boolean;
};
export function parseLearningActivity(value: string | null): LearningActivity[] {
  try {
    const rows: unknown = JSON.parse(value ?? '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((x): x is LearningActivity => !!x && typeof x.courseId === 'string' &&
      (x.source === 'personal' || x.source === 'public') && typeof x.updatedAt === 'string' && Number.isFinite(Date.parse(x.updatedAt)) &&
      (x.position === undefined || Number.isInteger(x.position) && x.position >= 0) &&
      (x.sectionId === undefined || typeof x.sectionId === 'string') && (x.lessonId === undefined || typeof x.lessonId === 'string') &&
      (x.finished === undefined || typeof x.finished === 'boolean')).slice(0, 12);
  } catch { return []; }
}
export function updateLearningActivity(rows: readonly LearningActivity[], item: Omit<LearningActivity, 'updatedAt'>, now: string): LearningActivity[] {
  const previous = rows.find(row => row.source === item.source && row.courseId === item.courseId);
  return [{ ...previous, ...item, updatedAt: now }, ...rows.filter(row => row.source !== item.source || row.courseId !== item.courseId)].slice(0, 12);
}
export function learningResumeRoute(item: Pick<LearningActivity, 'courseId' | 'source'>) {
  return item.source === 'personal' ? `/education/my-courses/${encodeURIComponent(item.courseId)}?start=1`
    : `/community/education/${encodeURIComponent(item.courseId)}?resume=1`;
}
