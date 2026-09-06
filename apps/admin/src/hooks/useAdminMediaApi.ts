import { useCallback } from 'react';
import { adminMediaApi, type ImageCategory } from '../api/adminMediaApi';

export type { ImageCategory };

export function useAdminMediaApi() {
  const uploadImage = useCallback((file: File, category: ImageCategory) => {
    return adminMediaApi.uploadImage(file, category);
  }, []);

  const resolveMediaPath = useCallback((path: string) => {
    return adminMediaApi.resolveMediaUrl(path);
  }, []);

  return {
    uploadImage,
    resolveMediaPath,
  };
}
