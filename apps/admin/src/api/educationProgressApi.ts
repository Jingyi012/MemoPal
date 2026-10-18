import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { EducationClassroomObjectiveProgressDto } from '../types/educationProgress';

export const educationProgressApi = {
  async getClassroomObjectiveProgress(classroomId: string) {
    return (await apiClient.get<ApiResponse<EducationClassroomObjectiveProgressDto>>(
      `/v1/education/classrooms/${classroomId}/objectives/progress`,
    )).data.data;
  },
};
