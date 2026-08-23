import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { Location } from '@/features/palace/shared/types/palace.types';

export const locationApi = {
  async getByPalace(palaceId: string): Promise<Location[]> {
    const response = await api.get<GeneralResponse<Location[]>>(`/palaces/${palaceId}/locations`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getById(id: string): Promise<Location> {
    const response = await api.get<GeneralResponse<Location>>(`/locations/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async create(location: Partial<Location>): Promise<Location> {
    const response = await api.post<GeneralResponse<Location>>('/locations', location);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async createBatch(locations: Partial<Location>[]): Promise<Location[]> {
    const response = await api.post<GeneralResponse<Location[]>>('/locations/batch', locations);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async update(location: Location): Promise<Location> {
    const response = await api.put<GeneralResponse<Location>>(`/locations/${location.id}`, location);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async updateBatch(locations: Partial<Location>[]): Promise<Location[]> {
    const response = await api.patch<GeneralResponse<Location[]>>('/locations/batch', locations);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async delete(id: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/locations/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
  },
  async deleteBatch(ids: string[]): Promise<void> {
    const response = await api.post<GeneralResponse<null>>('/locations/batch/delete', { ids });
    if (!response.data.success) throw new Error(response.data.message);
  },
};
