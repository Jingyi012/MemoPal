import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { Milestone } from '@/features/gamification/shared/types/levelAndbadge';

/**
 * API calls for milestones - organized by entity
 */
export const milestoneApi = {
  /**
   * Get all available milestones
   */
  async getAll(params?: Record<string, never>): Promise<Milestone[]> {
    const response = await api.get<GeneralResponse<Milestone[]>>('/milestones', { params });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get milestone by ID
   */
  async getById(id: string): Promise<Milestone> {
    const response = await api.get<GeneralResponse<Milestone>>(`/milestones/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Award milestone to user
   */
  async awardMilestone(milestoneId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(`/milestones/${milestoneId}/award`, {});
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },

};
