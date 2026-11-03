import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type StudyCourseDraftInput = { title: string; languageCode: string; entries: { text: string; meaning: string | null }[] };
export type StudyCourseDraftResult = { courseId: string; studyItemCount: number; practiceQuestionCount: number; alreadyExists: boolean };
export async function createStudyCourseDraft(input: StudyCourseDraftInput): Promise<StudyCourseDraftResult> {
  const response = await api.post<GeneralResponse<StudyCourseDraftResult>>('/v1/education/course-drafts/from-study-list', input);
  if (!response.data.success || !response.data.data) throw new Error(response.data.message ?? 'Could not save the lesson draft.');
  return response.data.data;
}
