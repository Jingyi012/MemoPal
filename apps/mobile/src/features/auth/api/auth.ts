import api from '@/core/api/apiClient';
import { getDeviceSessionContext } from '@/features/auth/services/authSession.service';
import { AuthResponse, LoginMethods, LoginRequest } from '@/features/auth/types/auth';
import { GeneralResponse } from '@/core/types/general';
import { User } from '@/features/profile/types/users';
import { isAxiosError } from 'axios';

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

type LogoutRequest = {
  refreshToken?: string;
  logoutAllDevices?: boolean;
};

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
  const prioritizedKeys = ['message', 'detail', 'error', 'title'] as const;

  for (const key of prioritizedKeys) {
    const value = firstStringValue(data[key]);
    if (value) {
      return value;
    }
  }

  const errors = data.errors;
  if (errors && typeof errors === 'object') {
    const value = firstStringValue(Object.values(errors as Record<string, unknown>));
    if (value) {
      return value;
    }
  }

  return null;
}

function getApiDataOrThrow<T>(payload: GeneralResponse<T>, fallbackMessage: string): T {
  if (!payload.success || payload.data === null || payload.data === undefined) {
    throw new Error(payload.message ?? fallbackMessage);
  }

  return payload.data;
}

function assertAuthResponsePayload(payload: AuthResponse, fallbackMessage: string): AuthResponse {
  if (!payload?.token || !payload.token.trim()) {
    throw new Error(`${fallbackMessage} Missing access token.`);
  }

  if (!payload?.refreshToken || !payload.refreshToken.trim()) {
    throw new Error(`${fallbackMessage} Missing refresh token.`);
  }

  return payload;
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
      const device = await getDeviceSessionContext();
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/register', {
        ...data,
        ...device,
      });
      return assertAuthResponsePayload(
        getApiDataOrThrow<AuthResponse>(response.data, 'Registration failed.'),
        'Registration failed.'
      );
    } catch (error) {
      throw createApiClientError(error, 'Registration failed.');
    }
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const device = await getDeviceSessionContext();
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/login', {
        ...credentials,
        ...device,
      });
      return assertAuthResponsePayload(
        getApiDataOrThrow<AuthResponse>(response.data, 'Login failed.'),
        'Login failed.'
      );
    } catch (error) {
      throw createApiClientError(error, 'Login failed.');
    }
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    try {
      const device = await getDeviceSessionContext();
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/google', {
        idToken,
        ...device,
      });
      return assertAuthResponsePayload(
        getApiDataOrThrow<AuthResponse>(response.data, 'Google login failed.'),
        'Google login failed.'
      );
    } catch (error) {
      throw createApiClientError(error, 'Google login failed.');
    }
  },

  async facebookLogin(accessToken: string): Promise<AuthResponse> {
    try {
      const device = await getDeviceSessionContext();
      const response = await api.post<GeneralResponse<AuthResponse>>('/auth/facebook', {
        accessToken,
        ...device,
      });
      return assertAuthResponsePayload(
        getApiDataOrThrow<AuthResponse>(response.data, 'Facebook login failed.'),
        'Facebook login failed.'
      );
    } catch (error) {
      throw createApiClientError(error, 'Facebook login failed.');
    }
  },

  async getLoginMethods(): Promise<LoginMethods> {
    try {
      const response = await api.get<GeneralResponse<LoginMethods>>('/auth/login-methods');
      return getApiDataOrThrow<LoginMethods>(response.data, 'Failed to load login methods.');
    } catch (error) {
      throw createApiClientError(error, 'Failed to load login methods.');
    }
  },

  async getCurrentProfile(): Promise<User> {
    try {
      const response = await api.get<GeneralResponse<User>>('/auth/me');
      return getApiDataOrThrow<User>(response.data, 'Failed to load profile.');
    } catch (error) {
      throw createApiClientError(error, 'Failed to load profile.');
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch<GeneralResponse<User>>('/auth/profile', data);
      return getApiDataOrThrow<User>(response.data, 'Failed to update profile.');
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

      return getApiDataOrThrow<User>(response.data, 'Failed to upload avatar.');
    } catch (error) {
      throw createApiClientError(error, 'Failed to upload avatar.');
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const device = await getDeviceSessionContext();
      const response = await api.post<GeneralResponse<AuthResponse>>(
        '/auth/refresh',
        {
          refreshToken,
          ...device,
        },
        {
          // Avoid recursive refresh loops in the response interceptor.
          headers: { 'X-MemoPal-Skip-Refresh': '1' },
        }
      );

      return assertAuthResponsePayload(
        getApiDataOrThrow<AuthResponse>(response.data, 'Session refresh failed.'),
        'Session refresh failed.'
      );
    } catch (error) {
      throw createApiClientError(error, 'Session refresh failed.');
    }
  },

  async logout(payload?: LogoutRequest): Promise<void> {
    try {
      const device = await getDeviceSessionContext();
      await api.post<GeneralResponse<boolean>>(
        '/auth/logout',
        {
          refreshToken: payload?.refreshToken,
          logoutAllDevices: payload?.logoutAllDevices ?? false,
          deviceId: device.deviceId,
        },
        {
          headers: { 'X-MemoPal-Skip-Refresh': '1' },
        }
      );
    } catch (error) {
      throw createApiClientError(error, 'Logout failed.');
    }
  },
};
