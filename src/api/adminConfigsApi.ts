import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type {
  BadgeDefinitionDto,
  BadgeDefinitionUpsertRequest,
  LevelConfigDto,
  LevelConfigUpsertRequest,
  MilestoneDefinitionDto,
  MilestoneDefinitionUpsertRequest,
  MissionTemplateDto,
  XpConfigDto,
  XpConfigUpsertRequest,
} from '../types/config';

export const adminConfigsApi = {
  listXpConfigs(pageNumber = 1, pageSize = 20) {
    return apiClient
      .get<PaginatedResponse<XpConfigDto>>('/admin/xp-configs', { params: { pageNumber, pageSize } })
      .then((r) => r.data);
  },
  createXpConfig(payload: XpConfigUpsertRequest) {
    return apiClient.post<ApiResponse<XpConfigDto>>('/admin/xp-configs', payload).then((r) => r.data.data);
  },
  updateXpConfig(id: string, payload: XpConfigUpsertRequest) {
    return apiClient.patch<ApiResponse<XpConfigDto>>(`/admin/xp-configs/${id}`, payload).then((r) => r.data.data);
  },
  deleteXpConfig(id: string) {
    return apiClient.delete(`/admin/xp-configs/${id}`).then(() => undefined);
  },

  listLevelConfigs(pageNumber = 1, pageSize = 20) {
    return apiClient
      .get<PaginatedResponse<LevelConfigDto>>('/admin/level-configs', { params: { pageNumber, pageSize } })
      .then((r) => r.data);
  },
  createLevelConfig(level: number, payload: LevelConfigUpsertRequest) {
    return apiClient.post<ApiResponse<LevelConfigDto>>('/admin/level-configs', { level, ...payload }).then((r) => r.data.data);
  },
  updateLevelConfig(level: number, payload: LevelConfigUpsertRequest) {
    return apiClient.put<ApiResponse<LevelConfigDto>>(`/admin/level-configs/${level}`, payload).then((r) => r.data.data);
  },
  deleteLevelConfig(level: number) {
    return apiClient.delete(`/admin/level-configs/${level}`).then(() => undefined);
  },

  listBadgeDefinitions(pageNumber = 1, pageSize = 20, search = '') {
    return apiClient
      .get<PaginatedResponse<BadgeDefinitionDto>>('/admin/badge-definitions', {
        params: { pageNumber, pageSize, search: search || undefined },
      })
      .then((r) => r.data);
  },
  createBadgeDefinition(payload: BadgeDefinitionUpsertRequest) {
    return apiClient.post<ApiResponse<BadgeDefinitionDto>>('/admin/badge-definitions', payload).then((r) => r.data.data);
  },
  updateBadgeDefinition(id: string, payload: BadgeDefinitionUpsertRequest) {
    return apiClient.put<ApiResponse<BadgeDefinitionDto>>(`/admin/badge-definitions/${id}`, payload).then((r) => r.data.data);
  },
  deleteBadgeDefinition(id: string) {
    return apiClient.delete(`/admin/badge-definitions/${id}`).then(() => undefined);
  },

  listMilestoneDefinitions(pageNumber = 1, pageSize = 20, search = '') {
    return apiClient
      .get<PaginatedResponse<MilestoneDefinitionDto>>('/admin/milestone-definitions', {
        params: { pageNumber, pageSize, search: search || undefined },
      })
      .then((r) => r.data);
  },
  createMilestoneDefinition(payload: MilestoneDefinitionUpsertRequest) {
    return apiClient.post<ApiResponse<MilestoneDefinitionDto>>('/admin/milestone-definitions', payload).then((r) => r.data.data);
  },
  updateMilestoneDefinition(id: string, payload: MilestoneDefinitionUpsertRequest) {
    return apiClient.put<ApiResponse<MilestoneDefinitionDto>>(`/admin/milestone-definitions/${id}`, payload).then((r) => r.data.data);
  },
  deleteMilestoneDefinition(id: string) {
    return apiClient.delete(`/admin/milestone-definitions/${id}`).then(() => undefined);
  },

  listMissionTemplates() {
    return apiClient
      .get<ApiResponse<MissionTemplateDto[]>>('/admin/mission-templates')
      .then((r) => r.data.data);
  },

  updateMissionTemplates(templates: MissionTemplateDto[]) {
    return apiClient
      .put<ApiResponse<MissionTemplateDto[]>>('/admin/mission-templates', { templates })
      .then((r) => r.data.data);
  },
};
