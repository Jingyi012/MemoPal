import api from '@/api/api';
import { AuthResponse, LoginRequest } from '@/types/auth';
import { GeneralResponse } from '@/types/general';
import { User } from '@/types/users';

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

/**
 * API calls for Authentication and Profile Management
 */
export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<GeneralResponse<AuthResponse>>('/auth/register', data);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<GeneralResponse<AuthResponse>>('/auth/login', credentials);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async getCurrentProfile(): Promise<User> {
    const response = await api.get<GeneralResponse<User>>('/auth/me');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<GeneralResponse<User>>('/auth/profile', data);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
