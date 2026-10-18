import { apiClient } from "../lib/apiClient";
import type { PaginatedResponse } from "../types/api";
import type {
  CommunityMemorySetView,
  CommunityMemorySetStatus,
} from "../types/communityMemorySet";

const endpoint = "/admin/community-memory-sets";

export interface CommunityMemorySetListParams {
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
  }: CommunityMemorySetListParams = {}): Promise<PaginatedResponse<CommunityMemorySetView>> {
    const { data } = await apiClient.get<PaginatedResponse<CommunityMemorySetView>>(endpoint, {
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

  async setFeatured(id: string, featured: boolean): Promise<void> {
    await apiClient.patch(`${endpoint}/${id}/featured`, { featured });
  },
};
