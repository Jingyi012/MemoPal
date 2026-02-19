import api from '@/api/api';
import { GeneralResponse } from '@/types/general';

export interface UserStats {
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
  async getStats(): Promise<UserStats> {
    const response = await api.get<GeneralResponse<UserStats>>(`/users/stats`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update user statistics
   */
  async updateStats(stats: Partial<UserStats>): Promise<UserStats> {
    const response = await api.patch<GeneralResponse<UserStats>>(`/users/stats`, stats);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get user's current level and XP
   */
  async getLevel(): Promise<{ level: number; xp: number }> {
    const response = await api.get<GeneralResponse<{ level: number; xp: number }>>(`/users/level`);
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
