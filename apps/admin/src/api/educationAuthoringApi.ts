import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { EducationAssessmentDto, EducationCourseDto, EducationObjectiveDto, EducationQuestionRequest } from '../types/educationAuthoring';

export const educationAuthoringApi = {
  async listRecommendableMemorySets() {
    const { data } = await apiClient.get<{ data: { id: string; title: string; techniqueKey: string; goalType: string }[]; pagination: { totalCount: number } }>('/v1/community/memory-sets', {
      params: { pageNumber: 1, pageSize: 50, sort: 'popular' },
    });
    return data.data;
  },
  async listCourses() { return (await apiClient.get<ApiResponse<EducationCourseDto[]>>('/v1/education/courses')).data.data; },
  async createCourse(title: string) { return (await apiClient.post<ApiResponse<EducationCourseDto>>('/v1/education/courses', { title })).data.data; },
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
};
