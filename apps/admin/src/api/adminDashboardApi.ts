import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { DashboardView } from '../types/dashboard';

export const adminDashboardApi = {
  async get(): Promise<DashboardView> {
    const { data } = await apiClient.get<ApiResponse<DashboardView>>('/admin/dashboard');
    return data.data;
  },
};
