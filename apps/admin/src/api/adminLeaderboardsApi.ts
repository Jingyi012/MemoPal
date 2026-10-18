import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "../types/api";
import type { LeaderboardCatalogConfig } from "../types/leaderboards";

const endpoint = "/admin/leaderboards/config";

export const adminLeaderboardsApi = {
  async getConfig(): Promise<LeaderboardCatalogConfig> {
    const { data } = await apiClient.get<ApiResponse<LeaderboardCatalogConfig>>(endpoint);
    return data.data;
  },

  async updateConfig(config: LeaderboardCatalogConfig): Promise<LeaderboardCatalogConfig> {
    const { data } = await apiClient.put<ApiResponse<LeaderboardCatalogConfig>>(endpoint, { config });
    return data.data;
  },
};
