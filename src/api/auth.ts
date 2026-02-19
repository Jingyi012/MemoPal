import api from '@/api/api';
import { AuthResponse } from '@/types/auth';
import { GeneralResponse } from '@/types/general';
import { User } from '@/types/users';

/**
 * API calls for Authentication and Profile Management
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: any): Promise<AuthResponse> {
    const response = await api.post<GeneralResponse<AuthResponse>>('/auth/register', data);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Login user
   */
  async login(credentials: any): Promise<AuthResponse> {
    const response = await api.post<GeneralResponse<AuthResponse>>('/auth/login', credentials);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Get the current authenticated user's profile
   * Includes joined user_stats data
   */
  async getCurrentProfile(): Promise<User> {
    const response = await api.get<GeneralResponse<User>>('/auth/me');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update profile information
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<GeneralResponse<User>>('/auth/profile', data);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
