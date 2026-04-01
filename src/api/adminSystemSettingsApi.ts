import { apiClient } from "../lib/apiClient";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  SystemSettingDto,
  UpsertSystemSettingRequest,
} from "../types/systemSetting";

export const adminSystemSettingsApi = {
  async list(pageNumber = 1, pageSize = 20, search = "") {
    const r = await apiClient.get<PaginatedResponse<SystemSettingDto>>(
      "/admin/system-settings",
      {
        params: { pageNumber, pageSize, search: search || undefined },
      },
    );
    return r.data;
  },
  async getByKey(key: string) {
    const r = await apiClient.get<ApiResponse<SystemSettingDto>>(
      `/admin/system-settings/${encodeURIComponent(key)}`,
    );
    return r.data.data;
  },
  async upsert(payload: UpsertSystemSettingRequest) {
    const r = await apiClient.post<ApiResponse<SystemSettingDto>>(
      "/admin/system-settings",
      payload,
    );
    return r.data.data;
  },
};
