import { GeneralResponse, PagedResponse } from '@/types/general';
import { Palace, PalaceDetails } from '@/types/palace';
import api from './api';

export class PalaceService {
  static async getPagedPalaces(params: {
    pageNumber: number;
    pageSize: number;
  }): Promise<PagedResponse<Palace[]>> {
    const response = await api.get<PagedResponse<Palace[]>>('/palaces', {
      params,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch palaces');
    }
    return response.data;
  }

  static async getPalaceById(id: string): Promise<PalaceDetails> {
    const response = await api.get<GeneralResponse<PalaceDetails>>(`/palaces/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async createPalace(palace: Partial<Palace>): Promise<Palace> {
    const response = await api.post<GeneralResponse<Palace>>('/palaces', palace);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async updatePalace(id: string, palace: Partial<Palace>): Promise<Palace> {
    const response = await api.put<GeneralResponse<Palace>>(`/palaces/${id}`, palace);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  }

  static async deletePalace(id: string): Promise<boolean> {
    const response = await api.delete<GeneralResponse<null>>(`/palaces/${id}`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }

  /**
   * Get all user's unlocked palaces
   */
  static async getUserPalaces(userId: string): Promise<PagedResponse<Palace[]>> {
    const response = await api.get<PagedResponse<Palace[]>>(`/users/${userId}/palaces`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data;
  }

  /**
   * Unlock a palace for user
   */
  static async unlockPalace(userId: string, palaceId: string): Promise<boolean> {
    const response = await api.post<GeneralResponse<null>>(
      `/users/${userId}/palaces/${palaceId}/unlock`,
      {}
    );
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.success;
  }
}
