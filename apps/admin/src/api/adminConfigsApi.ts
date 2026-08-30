import { apiClient } from "../lib/apiClient";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  MilestoneDefinitionDto,
  MilestoneDefinitionUpsertRequest,
} from "../types/config";

export const adminConfigsApi = {
  async listMilestoneDefinitions(pageNumber = 1, pageSize = 20, search = "") {
    const r = await apiClient.get<PaginatedResponse<MilestoneDefinitionDto>>(
      "/admin/milestone-definitions",
      {
        params: { pageNumber, pageSize, search: search || undefined },
      },
    );
    return r.data;
  },
  async createMilestoneDefinition(payload: MilestoneDefinitionUpsertRequest) {
    const r = await apiClient.post<ApiResponse<MilestoneDefinitionDto>>(
      "/admin/milestone-definitions",
      payload,
    );
    return r.data.data;
  },
  async updateMilestoneDefinition(
    id: string,
    payload: MilestoneDefinitionUpsertRequest,
  ) {
    const r = await apiClient.put<ApiResponse<MilestoneDefinitionDto>>(
      `/admin/milestone-definitions/${id}`,
      payload,
    );
    return r.data.data;
  },
  async deleteMilestoneDefinition(id: string) {
    await apiClient.delete(`/admin/milestone-definitions/${id}`);
    return undefined;
  },
};
