import { apiClient } from '../lib/apiClient';
import { getDeviceSessionContext } from '../lib/authSession';
import type { ApiResponse } from '../types/api';
import type { AuthResponse, AuthUser } from '../types/auth';

type LogoutPayload = {
  refreshToken?: string;
  logoutAllDevices?: boolean;
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const device = getDeviceSessionContext();
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
    });
    return data.data;
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return data.data;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const device = getDeviceSessionContext();
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/refresh',
      {
        refreshToken,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      },
      {
        headers: { 'X-MemoPal-Skip-Refresh': '1' },
      },
    );

    return data.data;
  },

  async logout(payload?: LogoutPayload): Promise<void> {
    const device = getDeviceSessionContext();
    await apiClient.post<ApiResponse<boolean>>(
      '/auth/logout',
      {
        refreshToken: payload?.refreshToken,
        logoutAllDevices: payload?.logoutAllDevices ?? false,
        deviceId: device.deviceId,
      },
      {
        headers: { 'X-MemoPal-Skip-Refresh': '1' },
      },
    );
  },
};
