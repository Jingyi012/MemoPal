import api from '@/api/api';
import { GeneralResponse } from '@/types/general';

export interface UserStats {
  userId: string;
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  updatedAt?: string;
}

/**
 * API calls for user stats - organized by entity
 */
export const userStatsApi = {
  /**
   * Get user statistics
   */
  async getStats(userId: string): Promise<UserStats> {
    const response = await api.get<GeneralResponse<UserStats>>(`/users/${userId}/stats`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update user statistics
   */
  async updateStats(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
    const response = await api.patch<GeneralResponse<UserStats>>(`/users/${userId}/stats`, stats);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get user's current level and XP
   */
  async getLevel(userId: string): Promise<{ level: number; xp: number }> {
    const response = await api.get<GeneralResponse<{ level: number; xp: number }>>(
      `/users/${userId}/level`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get stats updated since last sync
   */
  async getUpdatedSince(lastSyncedAt: string): Promise<UserStats[]> {
    const response = await api.get<GeneralResponse<UserStats[]>>('/stats/updated', {
      params: { since: lastSyncedAt },
    });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
