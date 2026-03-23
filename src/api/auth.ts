import api from '@/api/api';
import { AuthResponse, LoginRequest } from '@/types/auth';
import { GeneralResponse } from '@/types/general';
import { User } from '@/types/users';
import { isAxiosError } from 'axios';

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

function getApiErrorMessage(error: unknown, fallback = 'Request failed.') {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: string; errors?: string[] } | undefined;
    if (payload?.message) return payload.message;
    if (payload?.errors?.length) return payload.errors[0];
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * API calls for Authentication and Profile Management
 */
export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/register', data);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Registration failed.'));
    }
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/login', credentials);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Login failed.'));
    }
  },

  async googleLogin(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/google', { accessToken });
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Google login failed.'));
    }
  },

  async facebookLogin(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/facebook', { accessToken });
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Facebook login failed.'));
    }
  },

  async getCurrentProfile(): Promise<User> {
    try {
      const response = await api.get<GeneralResponse<User>>('/auth/me');
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load profile.'));
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch<GeneralResponse<User>>('/auth/profile', data);
      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update profile.'));
    }
  },

  async uploadAvatar(fileUri: string, fileName = 'avatar.jpg'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      const response = await api.post<GeneralResponse<string>>('/auth/avatar-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) throw new Error(response.data.message);
      return response.data.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to upload avatar.'));
    }
  },
};
