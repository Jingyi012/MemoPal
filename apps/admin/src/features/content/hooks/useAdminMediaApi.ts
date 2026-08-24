import { useCallback } from 'react';
import { adminMediaApi, type AdminImageCategory } from '../../../api/adminMediaApi';

export type { AdminImageCategory };

export function useAdminMediaApi() {
  const uploadImage = useCallback((file: File, category: AdminImageCategory) => {
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
