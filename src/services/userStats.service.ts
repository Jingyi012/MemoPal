import { GeneralResponse } from '@/types/general';
import api from './api';

export interface UserStats {
  userId: string;
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  updatedAt?: string;
}

export class UserStatsService {
  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    const response = await api.get<GeneralResponse<UserStats>>(`/users/${userId}/stats`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Update user statistics
   */
  static async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
    const response = await api.patch<GeneralResponse<UserStats>>(`/users/${userId}/stats`, stats);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  /**
   * Get user's current XP and level
   */
  static async getUserLevel(userId: string): Promise<{ level: number; xp: number }> {
    const response = await api.get<GeneralResponse<{ level: number; xp: number }>>(
      `/users/${userId}/level`
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }
}
