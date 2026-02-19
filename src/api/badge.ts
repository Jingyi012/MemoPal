import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { Badge, UserBadge } from '@/types/levelAndbadge';

/**
 * API calls for badges - organized by entity
 */
export const badgeApi = {
  /**
   * Get all available badges
   */
  async getAll(params?: {}): Promise<Badge[]> {
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
   * Get user's earned badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const response = await api.get<GeneralResponse<UserBadge[]>>(`/users/${userId}/badges`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(
      `/users/${userId}/badges/${badgeId}`,
      {}
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },

  /**
   * Get badges updated since last sync
   */
  async getUpdatedSince(lastSyncedAt: string): Promise<Badge[]> {
    const response = await api.get<GeneralResponse<Badge[]>>('/badges/updated', {
      params: { since: lastSyncedAt },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
