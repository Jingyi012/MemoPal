import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { EducationPublicCourseDetail } from '../types/educationPractice.types';

export type PersonalStudySummary = { id: string; title: string; languageCode: string | null; readyToLearn: boolean; studyItemCount: number };
export type PersonalStudyCourse = { id: string; title: string; languageCode: string | null; readyToLearn: boolean; units: {
  id: string; title: string; objectiveId: string; studyItems: EducationPublicCourseDetail['objectives'][number]['studyItems']; assessmentId: string | null;
}[] };
export const personalStudyKeys = {
  list: (userId: string) => ['education', 'personal', userId, 'courses'] as const,
  course: (userId: string, id: string) => ['education', 'personal', userId, 'course', id] as const,
};
export async function getPersonalStudyCourses() {
  return (await api.get<GeneralResponse<PersonalStudySummary[]>>('/v1/education/my-courses')).data.data!;
}
export async function getPersonalStudyCourse(id: string) {
  return (await api.get<GeneralResponse<PersonalStudyCourse>>(`/v1/education/my-courses/${encodeURIComponent(id)}`)).data.data!;
}
export async function deletePersonalStudyCourse(id: string) {
  await api.delete<GeneralResponse<boolean>>(`/v1/education/my-courses/${encodeURIComponent(id)}`);
}
