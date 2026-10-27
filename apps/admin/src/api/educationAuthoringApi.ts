import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { EducationAssessmentDto, EducationCourseDto, EducationLearnerStudyItemDto, EducationObjectiveDto, EducationQuestionRequest, EducationStudyItemAuthorDto, EducationStudyItemImportResult, EducationStudyItemRequest } from '../types/educationAuthoring';

export const educationAuthoringApi = {
  async listRecommendableMemorySets() {
    const { data } = await apiClient.get<{ data: { id: string; title: string; techniqueKey: string; goalType: string }[]; pagination: { totalCount: number } }>('/v1/community/memory-sets', {
      params: { pageNumber: 1, pageSize: 50, sort: 'popular' },
    });
    return data.data;
  },
  async listCourses() { return (await apiClient.get<ApiResponse<EducationCourseDto[]>>('/v1/education/courses')).data.data; },
  async createCourse(title: string) { return (await apiClient.post<ApiResponse<EducationCourseDto>>('/v1/education/courses', { title })).data.data; },
  async updateCourseTitle(courseId: string, title: string) {
    return (await apiClient.put<ApiResponse<EducationCourseDto>>(`/v1/education/courses/${courseId}/title`, { title })).data.data;
  },
  async setCourseVisibility(courseId: string, isPublic: boolean) {
    return (await apiClient.put<ApiResponse<EducationCourseDto>>(`/v1/education/courses/${courseId}/visibility`, { isPublic })).data.data;
  },
  async listObjectives(courseId: string) { return (await apiClient.get<ApiResponse<EducationObjectiveDto[]>>(`/v1/education/courses/${courseId}/objectives`)).data.data; },
  async createObjective(courseId: string, title: string, recommendedMemorySetId?: string) { return (await apiClient.post<ApiResponse<EducationObjectiveDto>>(`/v1/education/courses/${courseId}/objectives`, { title, recommendedMemorySetId: recommendedMemorySetId || null })).data.data; },
  async setObjectiveMemoryRecommendation(courseId: string, objectiveId: string, recommendedMemorySetId: string | null) {
    return (await apiClient.put<ApiResponse<EducationObjectiveDto>>(
      `/v1/education/courses/${courseId}/objectives/${objectiveId}/memory-recommendation`,
      { recommendedMemorySetId },
    )).data.data;
  },
  async setObjectiveStudyMetadata(courseId: string, objectiveId: string, input: { memoryContentType: string; languageCode: string | null; gradeCode: string | null; curriculumCode: string | null; subjectCode: string | null; contentOrigin: string; reviewStatus: string }) {
    return (await apiClient.put<ApiResponse<EducationObjectiveDto>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-metadata`, input)).data.data;
  },
  async listStudyItems(courseId: string, objectiveId: string) {
    return (await apiClient.get<ApiResponse<EducationStudyItemAuthorDto[]>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items`)).data.data;
  },
  async createStudyItem(courseId: string, objectiveId: string, input: EducationStudyItemRequest) {
    return (await apiClient.post<ApiResponse<EducationStudyItemAuthorDto>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items`, input)).data.data;
  },
  async updateStudyItem(courseId: string, objectiveId: string, itemId: string, input: EducationStudyItemRequest) {
    return (await apiClient.put<ApiResponse<EducationStudyItemAuthorDto>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/${itemId}`, input)).data.data;
  },
  async deleteStudyItem(courseId: string, objectiveId: string, itemId: string) {
    return (await apiClient.delete<ApiResponse<boolean>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/${itemId}`)).data.data;
  },
  async reorderStudyItems(courseId: string, objectiveId: string, itemIds: string[]) {
    return (await apiClient.put<ApiResponse<EducationStudyItemAuthorDto[]>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/reorder`, { itemIds })).data.data;
  },
  async publishStudyItem(courseId: string, objectiveId: string, itemId: string, notConfidentialExamContent: boolean) {
    return (await apiClient.post<ApiResponse<EducationStudyItemAuthorDto>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/${itemId}/publish`, { notConfidentialExamContent })).data.data;
  },
  async retractStudyItem(courseId: string, objectiveId: string, itemId: string) {
    return (await apiClient.post<ApiResponse<EducationStudyItemAuthorDto>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/${itemId}/retract`, {})).data.data;
  },
  async importJson(courseId: string, objectiveId: string, items: EducationStudyItemRequest[], dryRun: boolean) {
    return (await apiClient.post<ApiResponse<EducationStudyItemImportResult>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/import/json`, items, { params: { dryRun } })).data.data;
  },
  async importCsv(courseId: string, objectiveId: string, content: Blob, dryRun: boolean) {
    return (await apiClient.post<ApiResponse<EducationStudyItemImportResult>>(`/v1/education/courses/${courseId}/objectives/${objectiveId}/study-items/import/csv`, content, { params: { dryRun }, headers: { 'Content-Type': 'text/csv' } })).data.data;
  },
  async learnerStudyItems(objectiveId: string) {
    return (await apiClient.get<ApiResponse<EducationLearnerStudyItemDto[]>>(`/v1/education/public/objectives/${objectiveId}/study-items`)).data.data;
  },
  async listAssessments(courseId: string) { return (await apiClient.get<ApiResponse<EducationAssessmentDto[]>>(`/v1/education/courses/${courseId}/assessments`)).data.data; },
  async createAssessment(courseId: string, title: string) { return (await apiClient.post<ApiResponse<EducationAssessmentDto>>(`/v1/education/courses/${courseId}/assessments`, { title })).data.data; },
  async getAssessment(id: string) { return (await apiClient.get<ApiResponse<EducationAssessmentDto>>(`/v1/education/assessments/${id}`)).data.data; },
  async updateAssessment(input: { id: string; expectedVersion: number; title: string; questions: EducationQuestionRequest[] }) {
    return (await apiClient.put<ApiResponse<EducationAssessmentDto>>(`/v1/education/assessments/${input.id}`, {
      expectedVersion: input.expectedVersion, title: input.title, questions: input.questions,
    })).data.data;
  },
  async publishAssessment(id: string, expectedVersion: number, isPublicPractice: boolean) {
    return (await apiClient.post<ApiResponse<EducationAssessmentDto>>(`/v1/education/assessments/${id}/publish`, { expectedVersion, isPublicPractice })).data.data;
  },
  async createAssessmentRevisionDraft(id: string, expectedVersion: number) {
    return (await apiClient.post<ApiResponse<EducationAssessmentDto>>(`/v1/education/assessments/${id}/revision-draft`, { expectedVersion })).data.data;
  },
  async setAssessmentPublicPractice(id: string, isPublicPractice: boolean, notConfidentialExamContent: boolean) {
    return (await apiClient.put<ApiResponse<EducationAssessmentDto>>(`/v1/education/assessments/${id}/public-practice`, {
      isPublicPractice, notConfidentialExamContent,
    })).data.data;
  },
};
