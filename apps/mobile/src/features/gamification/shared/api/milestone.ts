import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { Milestone } from '@/features/gamification/shared/types/milestone';

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

};
