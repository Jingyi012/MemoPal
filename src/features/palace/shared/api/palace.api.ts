import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { Palace } from '@/features/palace/shared/types/palace.types';

export const palaceApi = {
  async getAll(): Promise<Palace[]> {
    const response = await api.get<GeneralResponse<Palace[]>>('/palaces');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getById(id: string): Promise<Palace> {
    const response = await api.get<GeneralResponse<Palace>>(`/palaces/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async update(palace: Palace): Promise<Palace> {
    const response = await api.put<GeneralResponse<Palace>>(`/palaces/${palace.id}`, palace);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async create(palace: Partial<Palace>): Promise<Palace> {
    const response = await api.post<GeneralResponse<Palace>>('/palaces', palace);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async delete(id: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/palaces/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
  },
  async unlockPalace(palaceId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(`/palaces/${palaceId}/unlock`, {});
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },
};
