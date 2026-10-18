import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';

export interface EducationFamilyChild {
  studentUserId: string;
  studentName: string;
  linkedAt: string;
}

export const educationFamilyApi = {
  async listVerifiedChildren() {
    return (await apiClient.get<ApiResponse<EducationFamilyChild[]>>('/v1/education/family/children')).data.data;
  },
};
