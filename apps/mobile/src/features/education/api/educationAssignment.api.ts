import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';

export const educationAssignmentApi = {
  async getMyAssignments(): Promise<MyEducationAssignment[]> {
    const response = await api.get<GeneralResponse<MyEducationAssignment[]>>(
      '/v1/education/my/assignments',
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not load assignments.');
    }
    return response.data.data;
  },
  async updateLeaderboardPreference(assignmentId: string, includeInLeaderboard: boolean): Promise<boolean> {
    const response = await api.put<GeneralResponse<boolean>>(
      `/v1/education/assignments/${assignmentId}/leaderboard-preference`, { includeInLeaderboard },
    );
    if (!response.data.success || response.data.data === undefined) {
      throw new Error(response.data.message ?? 'Could not update leaderboard preference.');
    }
    return response.data.data;
  },
};
