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

export interface FeatureLimits {
  isPremium: boolean;
  customPalaces: number;
  customLessonsPerPalace: number;
  customLocationsPerPalace: number;
  customWordsPerLesson: number;
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
   * Get current user's effective feature limits (free/premium resolved by backend)
   */
  async getFeatureLimits(): Promise<FeatureLimits> {
    const response = await api.get<GeneralResponse<FeatureLimits>>(`/users/feature-limits`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
