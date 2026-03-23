import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { ManagedUserDataDto, ManagedUserDto, ManagedUserUpsertRequest } from '../types/user';

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
