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

export type ApiClientError = Error & {
  statusCode?: number;
  isNetworkError?: boolean;
};

function firstStringValue(input: unknown): string | null {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed || /^<!doctype html/i.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const value = firstStringValue(item);
      if (value) return value;
    }
  }

  return null;
}

function extractMessageFromPayload(payload: unknown): string | null {
  if (!payload) {
    return null;
  }

  const direct = firstStringValue(payload);
  if (direct) {
    return direct;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const prioritizedKeys = [
    'message',
    'Message',
    'detail',
    'Detail',
    'error',
    'Error',
    'title',
    'Title',
  ] as const;

  for (const key of prioritizedKeys) {
    const value = firstStringValue(data[key]);
    if (value) {
      return value;
    }
  }

  const errors = data.errors ?? data.Errors;
  if (errors && typeof errors === 'object') {
    const value = firstStringValue(Object.values(errors as Record<string, unknown>));
    if (value) {
      return value;
    }
  }

  return null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeEnvelope<T>(payload: unknown): {
  success: boolean;
  data: T | null;
  message: string | null;
} {
  const record = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const success = readBoolean(record.success) ?? readBoolean(record.Success) ?? false;
  const data = (record.data ?? record.Data ?? null) as T | null;
  const message = extractMessageFromPayload(record);

  return { success, data, message };
}

function unwrapApiResponse<T>(payload: unknown, fallbackMessage: string): T {
  const { success, data, message } = normalizeEnvelope<T>(payload);
  if (!success) {
    throw new Error(message ?? fallbackMessage);
  }
  if (data === null || data === undefined) {
    throw new Error(message ?? fallbackMessage);
  }
  return data;
}

function getApiErrorMessage(error: unknown, fallback = 'Request failed.') {
  if (isAxiosError(error)) {
    const messageFromPayload = extractMessageFromPayload(error.response?.data);
    if (messageFromPayload) return messageFromPayload;
    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function createApiClientError(error: unknown, fallback = 'Request failed.'): ApiClientError {
  const normalized = new Error(getApiErrorMessage(error, fallback)) as ApiClientError;

  if (isAxiosError(error)) {
    normalized.statusCode = error.response?.status;
    normalized.isNetworkError = !error.response;
  }

  return normalized;
}

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/register', data);
      return unwrapApiResponse<AuthResponse>(response.data, 'Registration failed.');
    } catch (error) {
      throw createApiClientError(error, 'Registration failed.');
    }
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/login', credentials);
      return unwrapApiResponse<AuthResponse>(response.data, 'Login failed.');
    } catch (error) {
      throw createApiClientError(error, 'Login failed.');
    }
  },

  async googleLogin(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/google', { accessToken });
      return unwrapApiResponse<AuthResponse>(response.data, 'Google login failed.');
    } catch (error) {
      throw createApiClientError(error, 'Google login failed.');
    }
  },

  async facebookLogin(accessToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/facebook', { accessToken });
      return unwrapApiResponse<AuthResponse>(response.data, 'Facebook login failed.');
    } catch (error) {
      throw createApiClientError(error, 'Facebook login failed.');
    }
  },

  async getCurrentProfile(): Promise<User> {
    try {
      const response = await api.get<GeneralResponse<User>>('/auth/me');
      return unwrapApiResponse<User>(response.data, 'Failed to load profile.');
    } catch (error) {
      throw createApiClientError(error, 'Failed to load profile.');
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch<GeneralResponse<User>>('/auth/profile', data);
      return unwrapApiResponse<User>(response.data, 'Failed to update profile.');
    } catch (error) {
      throw createApiClientError(error, 'Failed to update profile.');
    }
  },

  async uploadAvatar(fileUri: string, fileName = 'avatar.jpg'): Promise<User> {
    try {
      const normalizedName = fileName || fileUri.split('/').pop() || 'avatar.jpg';
      const ext = normalizedName.split('.').pop()?.toLowerCase();
      const mimeByExt: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      const mimeType = (ext && mimeByExt[ext]) || 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: normalizedName,
        type: mimeType,
      } as any);

      const response = await api.post<GeneralResponse<User>>('/auth/avatar-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return unwrapApiResponse<User>(response.data, 'Failed to upload avatar.');
    } catch (error) {
      throw createApiClientError(error, 'Failed to upload avatar.');
    }
  },
};
