import { GeneralResponse, PagedResponse } from '@/types/general';
import { Badge } from '@/types/levelAndbadge';
import api from './api';

export class BadgeService {
  /**
   * Get all available badges
   */
  static async getBadges(params: {}): Promise<GeneralResponse<Badge[]>> {
    const response = await api.get<GeneralResponse<Badge[]>>('/badges', {
      params,
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  /**
   * Get a single badge by ID
   */
  static async getBadgeById(id: string): Promise<Badge> {
    const response = await api.get<GeneralResponse<Badge>>(`/badges/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Get all user's earned badges
   */
  static async getUserBadges(userId: string): Promise<PagedResponse<Badge[]>> {
    const response = await api.get<PagedResponse<Badge[]>>(`/users/${userId}/badges`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  /**
   * Award a badge to user
   */
  static async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(
      `/users/${userId}/badges/${badgeId}`,
      {}
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }
}
