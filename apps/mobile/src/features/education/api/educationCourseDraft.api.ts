import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type EducationCourseContentType = 'LanguageItem' | 'VocabularyPair' | 'ConceptUnderstanding' | 'VerbatimText';
export type EducationCourseAiInput = { title: string; languageCode: string; meaningLanguageCode: string; difficulty: 'basic' | 'advanced'; contentType: EducationCourseContentType; units: { id: string; title: string; entries: { id: string; text: string; meaning: string | null }[] }[] };
export type StudyCourseAiMatchingPair = { entryId: string; left: string; right: string };
export type StudyCourseAiOutput = { suggestions: { entryId: string; meaning: string | null; needsReview: boolean }[]; questions: { unitId: string; entryId: string; prompt: string; type: string; options: string[]; correctOptionIndex: number; answer?: string | null; explanation?: string | null; isRuleBased?: boolean; pairs?: StudyCourseAiMatchingPair[]; correctBooleanAnswer?: boolean | null; correctSequenceIds?: string[] | null }[] };
export type StudyCourseGenerationEstimate = { available: boolean; reason?: string | null; textCost: number; maxCredits: number; availableCredits: number };
export type StudyCourseGenerationResult = { generationId: string; status: string; output: StudyCourseAiOutput | null; charged: number; inputHash: string };
export type StudyCourseDraftInput = { title: string; languageCode: string; memoryContentType?: EducationCourseContentType; groupSize?: number | null; startLearning?: boolean; sourceDraftId?: string; generationId?: string; meaningLanguageCode?: string; difficulty?: 'basic' | 'advanced'; confirmedSuggestionIds?: string[]; includedQuestionIndexes?: number[]; units?: { title: string; stableId?: string; entries: { text: string; meaning: string | null; stableId?: string }[] }[]; entries?: { text: string; meaning: string | null; stableId?: string }[] };
export type StudyCourseDraftResult = { courseId: string; studyItemCount: number; practiceQuestionCount: number; alreadyExists: boolean; readyToLearn: boolean };
export async function createStudyCourseDraft(input: StudyCourseDraftInput): Promise<StudyCourseDraftResult> {
  const response = await api.post<GeneralResponse<StudyCourseDraftResult>>('/v1/education/course-drafts/from-study-list', input);
  if (!response.data.success || !response.data.data) throw new Error(response.data.message ?? 'Could not save the lesson draft.');
  return response.data.data;
}
export async function estimateStudyCourseGeneration(input: EducationCourseAiInput): Promise<StudyCourseGenerationEstimate> {
  const response = await api.post<GeneralResponse<StudyCourseGenerationEstimate>>('/v1/education/course-drafts/generation-estimate', input);
  if (!response.data.success || !response.data.data) throw new Error(response.data.message ?? 'Could not check AI availability.');
  return response.data.data;
}
export async function generateStudyCourseDraft(requestId: string, maxCredits: number, input: EducationCourseAiInput): Promise<StudyCourseGenerationResult> {
  const response = await api.post<GeneralResponse<StudyCourseGenerationResult>>('/v1/education/course-drafts/generate', { requestId, maxCredits, input });
  if (!response.data.success || !response.data.data) throw new Error(response.data.message ?? 'Could not prepare the study content.');
  return response.data.data;
}
export async function recoverStudyCourseGeneration(requestId: string): Promise<StudyCourseGenerationResult> {
  const response = await api.get<GeneralResponse<StudyCourseGenerationResult>>(`/v1/education/course-drafts/generations/${encodeURIComponent(requestId)}`);
  if (!response.data.success || !response.data.data) throw new Error(response.data.message ?? 'Could not recover the preparation.');
  return response.data.data;
}
