import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type EducationFamilyChild = Readonly<{
  studentUserId: string;
  studentName: string;
  linkedAt: string;
}>;

export type EducationQuestionTypePerformance = Readonly<{
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  distinctQuestionCount: number;
  distinctAssessmentCount: number;
  distinctSubmissionDateCount: number;
}>;

export type EducationFamilyAssignmentProgress = Readonly<{
  assignmentId: string;
  title: string;
  scope: 'classroom' | 'family';
  opensAt: string;
  dueAt: string;
  status: 'not-started' | 'in-progress' | 'submitted';
  startedAt: string | null;
  submittedAt: string | null;
  resultPublished: boolean;
  score: number | null;
  maxScore: number | null;
  selectedResponsePerformance: EducationQuestionTypePerformance;
  openResponsePerformance: EducationQuestionTypePerformance;
}>;

export type EducationFamilyReport = Readonly<{
  studentUserId: string;
  studentName: string;
  assignmentCount: number;
  notStartedCount: number;
  inProgressCount: number;
  submittedCount: number;
  publishedResultCount: number;
  assignments: readonly EducationFamilyAssignmentProgress[];
}>;

function readData<T>(response: GeneralResponse<T>, message: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? message);
  return response.data;
}

export const educationFamilyReportApi = {
  async getChildren(): Promise<EducationFamilyChild[]> {
    const response = await api.get<GeneralResponse<EducationFamilyChild[]>>('/v1/education/family/children');
    return readData(response.data, 'Could not load linked children.');
  },
  async getReport(studentUserId: string): Promise<EducationFamilyReport> {
    const response = await api.get<GeneralResponse<EducationFamilyReport>>(
      `/v1/education/family/children/${encodeURIComponent(studentUserId)}/report`,
    );
    return readData(response.data, 'Could not load the family report.');
  },
};
