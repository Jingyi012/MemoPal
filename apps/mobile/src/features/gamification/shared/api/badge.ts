import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { Badge } from '@/features/gamification/shared/types/levelAndbadge';

/**
 * API calls for badges - organized by entity
 */
export const badgeApi = {
  /**
   * Get all available badges
   */
  async getAll(params?: Record<string, never>): Promise<Badge[]> {
    const response = await api.get<GeneralResponse<Badge[]>>('/badges', { params });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get badge by ID
   */
  async getById(id: string): Promise<Badge> {
    const response = await api.get<GeneralResponse<Badge>>(`/badges/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Award badge to user
   */
  async awardBadge(badgeId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(`/badges/${badgeId}/award`, {});
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },

};
