import { apiClient } from '../lib/apiClient';
import { resolveMediaUrl } from '../lib/mediaUrl';
import type { ApiResponse } from '../types/api';

export type AdminImageCategory = 'palace' | 'location' | 'general';

export const adminMediaApi = {
  async uploadImage(file: File, category: AdminImageCategory): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await apiClient.post<ApiResponse<string>>('/admin/media/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data;
  },

  resolveMediaUrl(path: string): string {
    return resolveMediaUrl(path, apiClient.defaults.baseURL);
  },
};
