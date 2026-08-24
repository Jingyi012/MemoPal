import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type {
  ManagedUserBadgeDataDto,
  ManagedUserDataDto,
  ManagedUserDataOverviewDto,
  ManagedUserLessonDataDto,
  ManagedUserLessonProgressDataDto,
  ManagedUserMilestoneDataDto,
  ManagedUserNotificationDataDto,
  ManagedUserPalaceDataDto,
  ManagedUserPalaceListItemDto,
  ManagedUserSubscriptionDataDto,
  ManagedUserDto,
  ManagedUserUpsertRequest,
  ManagedUserXpEventDataDto,
} from '../types/user';

export const adminUsersApi = {
  async list(pageNumber = 1, pageSize = 20, search = '', includeDeleted = false): Promise<PaginatedResponse<ManagedUserDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserDto>>('/admin/users', {
      params: { pageNumber, pageSize, search: search || undefined, includeDeleted },
    });

    return data;
  },

  async getById(userId: string): Promise<ManagedUserDto> {
    const { data } = await apiClient.get<ApiResponse<ManagedUserDto>>(`/admin/users/${userId}`);
    return data.data;
  },

  async getUserData(userId: string): Promise<ManagedUserDataDto> {
    const { data } = await apiClient.get<ApiResponse<ManagedUserDataDto>>(`/admin/users/${userId}/data`);
    return data.data;
  },

  async getUserDataOverview(userId: string): Promise<ManagedUserDataOverviewDto> {
    const { data } = await apiClient.get<ApiResponse<ManagedUserDataOverviewDto>>(`/admin/users/${userId}/data/overview`);
    return data.data;
  },

  async listUserPalaces(userId: string): Promise<ManagedUserPalaceDataDto[]> {
    const { data } = await apiClient.get<ApiResponse<ManagedUserPalaceDataDto[]>>(`/admin/users/${userId}/data/palaces`);
    return data.data;
  },

  async listUserPalacesPaged(
    userId: string,
    pageNumber = 1,
    pageSize = 10,
    options?: { isCustom?: boolean; requireUserLessons?: boolean }
  ): Promise<PaginatedResponse<ManagedUserPalaceListItemDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserPalaceListItemDto>>(
      `/admin/users/${userId}/data/palaces/paged`,
      {
        params: {
          pageNumber,
          pageSize,
          isCustom: options?.isCustom,
          requireUserLessons: options?.requireUserLessons,
        },
      }
    );
    return data;
  },

  async listUserLessons(
    userId: string,
    pageNumber = 1,
    pageSize = 10,
    palaceId?: string
  ): Promise<PaginatedResponse<ManagedUserLessonDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserLessonDataDto>>(`/admin/users/${userId}/data/lessons`, {
      params: { pageNumber, pageSize, palaceId: palaceId || undefined },
    });
    return data;
  },

  async listAllUserLessonsByPalace(userId: string, palaceId: string): Promise<ManagedUserLessonDataDto[]> {
    const pageSize = 100;
    let pageNumber = 1;
    let totalCount = Number.MAX_SAFE_INTEGER;
    const all: ManagedUserLessonDataDto[] = [];

    while (all.length < totalCount) {
      const page = await this.listUserLessons(userId, pageNumber, pageSize, palaceId);
      all.push(...page.data);
      totalCount = page.pagination.totalCount;
      if (page.data.length === 0) {
        break;
      }
      pageNumber += 1;
    }

    return all;
  },

  async listUserProgresses(userId: string, pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<ManagedUserLessonProgressDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserLessonProgressDataDto>>(`/admin/users/${userId}/data/progresses`, {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  async listUserXpEvents(userId: string, pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<ManagedUserXpEventDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserXpEventDataDto>>(`/admin/users/${userId}/data/xp-events`, {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  async listUserBadges(userId: string, pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<ManagedUserBadgeDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserBadgeDataDto>>(`/admin/users/${userId}/data/badges`, {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  async listUserMilestones(userId: string, pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<ManagedUserMilestoneDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserMilestoneDataDto>>(`/admin/users/${userId}/data/milestones`, {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  async listUserNotifications(userId: string, pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<ManagedUserNotificationDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserNotificationDataDto>>(`/admin/users/${userId}/data/notifications`, {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  async listUserSubscriptions(userId: string, pageNumber = 1, pageSize = 10): Promise<PaginatedResponse<ManagedUserSubscriptionDataDto>> {
    const { data } = await apiClient.get<PaginatedResponse<ManagedUserSubscriptionDataDto>>(`/admin/users/${userId}/data/subscriptions`, {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  async create(payload: ManagedUserUpsertRequest): Promise<ManagedUserDto> {
    const { data } = await apiClient.post<ApiResponse<ManagedUserDto>>('/admin/users', payload);
    return data.data;
  },

  async update(userId: string, payload: ManagedUserUpsertRequest): Promise<ManagedUserDto> {
    const { data } = await apiClient.put<ApiResponse<ManagedUserDto>>(`/admin/users/${userId}`, payload);
    return data.data;
  },

  async remove(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },
};
