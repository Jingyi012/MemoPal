import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { Palace } from '@/types/palace';

/**
 * API calls for palaces - organized by entity
 */
export const palaceApi = {
  /**
   * Fetch all palaces
   */
  async getAll(): Promise<Palace[]> {
    const response = await api.get<GeneralResponse<Palace[]>>('/palaces');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Fetch palace by ID
   */
  async getById(id: string): Promise<Palace> {
    const response = await api.get<GeneralResponse<Palace>>(`/palaces/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Update palace
   */
  async update(palace: Palace): Promise<Palace> {
    const response = await api.put<GeneralResponse<Palace>>(`/palaces/${palace.id}`, palace);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Create a new palace
   */
  async create(palace: Partial<Palace>): Promise<Palace> {
    const response = await api.post<GeneralResponse<Palace>>('/palaces', palace);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },

  /**
   * Delete palace
   */
  async delete(id: string): Promise<void> {
    const response = await api.delete<GeneralResponse<null>>(`/palaces/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
  },

  /**
   * Unlock a palace for a user
   */
  async unlockPalace(palaceId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(`/palaces/${palaceId}/unlock`, {});
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  },

};
