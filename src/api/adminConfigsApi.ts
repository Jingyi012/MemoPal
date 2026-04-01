import { apiClient } from "../lib/apiClient";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  BadgeDefinitionDto,
  BadgeDefinitionUpsertRequest,
  MilestoneDefinitionDto,
  MilestoneDefinitionUpsertRequest,
  MissionTemplateDto,
} from "../types/config";

export const adminConfigsApi = {
  async listBadgeDefinitions(pageNumber = 1, pageSize = 20, search = "") {
    const r = await apiClient.get<PaginatedResponse<BadgeDefinitionDto>>(
      "/admin/badge-definitions",
      {
        params: { pageNumber, pageSize, search: search || undefined },
      },
    );
    return r.data;
  },
  async createBadgeDefinition(payload: BadgeDefinitionUpsertRequest) {
    const r = await apiClient.post<ApiResponse<BadgeDefinitionDto>>(
      "/admin/badge-definitions",
      payload,
    );
    return r.data.data;
  },
  async updateBadgeDefinition(
    id: string,
    payload: BadgeDefinitionUpsertRequest,
  ) {
    const r = await apiClient.put<ApiResponse<BadgeDefinitionDto>>(
      `/admin/badge-definitions/${id}`,
      payload,
    );
    return r.data.data;
  },
  async deleteBadgeDefinition(id: string) {
    await apiClient.delete(`/admin/badge-definitions/${id}`);
    return undefined;
  },

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

  async listMissionTemplates() {
    const r = await apiClient.get<ApiResponse<MissionTemplateDto[]>>(
      "/admin/mission-templates",
    );
    return r.data.data;
  },

  async updateMissionTemplates(templates: MissionTemplateDto[]) {
    const r = await apiClient.put<ApiResponse<MissionTemplateDto[]>>(
      "/admin/mission-templates",
      { templates },
    );
    return r.data.data;
  },
};
