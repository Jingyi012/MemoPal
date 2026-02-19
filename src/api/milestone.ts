import api from '@/api/api';
import { GeneralResponse, PagedResponse } from '@/types/general';
import { Milestone, UserMilestone } from '@/types/levelAndbadge';

/**
 * API calls for milestones - organized by entity
 */
export const milestoneApi = {
  /**
   * Get all available milestones
   */
  async getAll(params?: {}): Promise<Milestone[]> {
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
   * Get user's achieved milestones
   */
  async getUserMilestones(userId: string) {
    const response = await api.get<PagedResponse<UserMilestone[]>>(`/users/${userId}/milestones`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Award milestone to user
   */
  async awardMilestone(userId: string, milestoneId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(
      `/users/${userId}/milestones/${milestoneId}`,
      {}
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },

  /**
   * Get milestones updated since last sync
   */
  async getUpdatedSince(lastSyncedAt: string): Promise<Milestone[]> {
    const response = await api.get<GeneralResponse<Milestone[]>>('/milestones/updated', {
      params: { since: lastSyncedAt },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
