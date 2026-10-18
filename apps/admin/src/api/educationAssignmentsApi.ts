import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { CreateEducationAssignmentRequest, CreateEducationRetakeRequest, CreateFamilyEducationAssignmentRequest, EducationAssignmentDto, EducationAssignmentGradebookDto } from '../types/educationAssignments';

export const educationAssignmentsApi = {
  async listClassroom(classroomId: string) {
    return (await apiClient.get<ApiResponse<EducationAssignmentDto[]>>(`/v1/education/classrooms/${classroomId}/assignments`)).data.data;
  },
  async createClassroom(classroomId: string, input: CreateEducationAssignmentRequest) {
    return (await apiClient.post<ApiResponse<EducationAssignmentDto>>(`/v1/education/classrooms/${classroomId}/assignments`, input)).data.data;
  },
  async createRetake(assignmentId: string, input: CreateEducationRetakeRequest) {
    return (await apiClient.post<ApiResponse<EducationAssignmentDto>>(`/v1/education/assignments/${assignmentId}/retakes`, input)).data.data;
  },
  async listFamily() {
    return (await apiClient.get<ApiResponse<EducationAssignmentDto[]>>('/v1/education/family/assignments')).data.data;
  },
  async createFamily(input: CreateFamilyEducationAssignmentRequest) {
    return (await apiClient.post<ApiResponse<EducationAssignmentDto>>('/v1/education/assignments/family', input)).data.data;
  },
  async getGradebook(assignmentId: string) {
    return (await apiClient.get<ApiResponse<EducationAssignmentGradebookDto>>(`/v1/education/assignments/${assignmentId}/gradebook`)).data.data;
  },
  async publishResults(assignmentId: string) {
    return (await apiClient.post<ApiResponse<{ assignmentId: string; resultsPublishedAt: string }>>(`/v1/education/assignments/${assignmentId}/publish-results`)).data.data;
  },
  async correctGrade(assignmentId: string, attemptId: string, input: { score: number; reason: string }) {
    return (await apiClient.post<ApiResponse<{ assignmentId: string; attemptId: string; revisionId: string; score: number; maxScore: number; resultsPublishedAt: string | null; correctedAt: string }>>(
      `/v1/education/assignments/${assignmentId}/attempts/${attemptId}/correct-grade`, input)).data.data;
  },
  async gradeWrittenResponse(assignmentId: string, attemptId: string, questionId: string, input: { score: number; feedback: string }) {
    return (await apiClient.post<ApiResponse<{ assignmentId: string; attemptId: string; questionId: string; attemptScore: number | null; maxScore: number; attemptFullyGraded: boolean }>>(
      `/v1/education/assignments/${assignmentId}/attempts/${attemptId}/responses/${questionId}/grade`, input)).data.data;
  },
  async getAttemptPhoto(attemptId: string, questionId: string, attachmentId: string) {
    return (await apiClient.get<Blob>(`/v1/education/attempts/${attemptId}/responses/${questionId}/photos/${attachmentId}`, { responseType: 'blob' })).data;
  },
  async getAttemptAttachment(attemptId: string, questionId: string, attachmentId: string) {
    return (await apiClient.get<Blob>(`/v1/education/attempts/${attemptId}/responses/${questionId}/attachments/${attachmentId}`, { responseType: 'blob' })).data;
  },
};
