import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { isAxiosError } from 'axios';

function getApiDataOrThrow<T>(payload: GeneralResponse<T>, fallbackMessage: string): T {
  if (!payload.success || payload.data === null || payload.data === undefined) {
    throw new Error(payload.message ?? fallbackMessage);
  }
  return payload.data;
}

function createApiError(error: unknown, fallbackMessage: string): Error {
  if (isAxiosError(error)) {
    const apiMessage =
      (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
    return new Error(apiMessage || fallbackMessage);
  }

  if (error instanceof Error) return error;
  return new Error(fallbackMessage);
}

export const mediaApi = {
  async uploadImage(
    fileUri: string,
    fileName = 'image.jpg',
    category = 'content'
  ): Promise<string> {
    try {
      const normalizedName = fileName || fileUri.split('/').pop() || 'image.jpg';
      const ext = normalizedName.split('.').pop()?.toLowerCase();
      const mimeByExt: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      const mimeType = (ext && mimeByExt[ext]) || 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: normalizedName,
        type: mimeType,
      } as any);
      formData.append('category', category);

      const response = await api.post<GeneralResponse<string>>('/media/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return getApiDataOrThrow(response.data, 'Failed to upload image.');
    } catch (error) {
      throw createApiError(error, 'Failed to upload image.');
    }
  },
};

