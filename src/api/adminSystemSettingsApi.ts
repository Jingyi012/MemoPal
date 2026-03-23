import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { SystemSettingDto, UpsertSystemSettingRequest } from '../types/systemSetting';

export const adminSystemSettingsApi = {
  list(pageNumber = 1, pageSize = 20, search = '') {
    return apiClient
      .get<PaginatedResponse<SystemSettingDto>>('/admin/system-settings', {
        params: { pageNumber, pageSize, search: search || undefined },
      })
      .then((r) => r.data);
  },
  upsert(payload: UpsertSystemSettingRequest) {
    return apiClient.post<ApiResponse<SystemSettingDto>>('/admin/system-settings', payload).then((r) => r.data.data);
  },
};
