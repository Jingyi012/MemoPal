import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { AuthResponse, AuthUser } from '../types/auth';

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return data.data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return data.data;
  },
};
