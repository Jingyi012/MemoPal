import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';

export type AdminImageCategory = 'palace' | 'location' | 'general';

function joinBaseUrl(baseUrl: string | undefined, relativePath: string) {
  if (!baseUrl) return relativePath;
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${normalizedBase}${normalizedPath}`;
}

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
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    return joinBaseUrl(apiClient.defaults.baseURL, path);
  },
};
