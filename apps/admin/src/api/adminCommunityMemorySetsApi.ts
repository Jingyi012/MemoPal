import { apiClient } from "../lib/apiClient";
import type { PaginatedResponse } from "../types/api";
import type {
  AdminCommunityMemorySetDto,
  CommunityMemorySetStatus,
} from "../types/communityMemorySet";

const endpoint = "/admin/community-memory-sets";

export interface AdminCommunityMemorySetListParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: CommunityMemorySetStatus;
}

export const adminCommunityMemorySetsApi = {
  async list({
    pageNumber = 1,
    pageSize = 20,
    search = "",
    status,
  }: AdminCommunityMemorySetListParams = {}): Promise<PaginatedResponse<AdminCommunityMemorySetDto>> {
    const { data } = await apiClient.get<PaginatedResponse<AdminCommunityMemorySetDto>>(endpoint, {
      params: {
        pageNumber,
        pageSize,
        search: search || undefined,
        status,
      },
    });
    return data;
  },

  async hide(id: string, reason?: string): Promise<void> {
    await apiClient.patch(`${endpoint}/${id}/hide`, reason ? { reason } : {});
  },

  async restore(id: string): Promise<void> {
    await apiClient.patch(`${endpoint}/${id}/restore`);
  },
};
