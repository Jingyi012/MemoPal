import { GeneralResponse, PagedResponse } from '@/types/general';
import { Milestone } from '@/types/levelAndbadge';
import api from './api';

export class MilestoneService {
  /**
   * Get all available milestones
   */
  static async getMilestones(params: {}): Promise<GeneralResponse<Milestone[]>> {
    const response = await api.get<GeneralResponse<Milestone[]>>('/milestones', {
      params,
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  /**
   * Get a single milestone by ID
   */
  static async getMilestoneById(id: string): Promise<Milestone> {
    const response = await api.get<GeneralResponse<Milestone>>(`/milestones/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Get all user's achieved milestones
   */
  static async getUserMilestones(userId: string): Promise<PagedResponse<Milestone[]>> {
    const response = await api.get<PagedResponse<Milestone[]>>(`/users/${userId}/milestones`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  /**
   * Award a milestone to user
   */
  static async awardMilestone(userId: string, milestoneId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(
      `/users/${userId}/milestones/${milestoneId}`,
      {}
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }
}
