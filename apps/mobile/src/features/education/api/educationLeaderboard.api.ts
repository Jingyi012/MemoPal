import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { EducationAssignmentLeaderboard } from '../types/educationLeaderboard.types';

export const educationLeaderboardApi = {
  async getMyAssignmentRank(assignmentId: string): Promise<EducationAssignmentLeaderboard> {
    const response = await api.get<GeneralResponse<EducationAssignmentLeaderboard>>(
      `/v1/education/assignments/${assignmentId}/leaderboard`,
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not load your class rank.');
    }
    return response.data.data;
  },
};
