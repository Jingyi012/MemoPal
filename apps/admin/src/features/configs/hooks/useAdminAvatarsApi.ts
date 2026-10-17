import { useCallback } from 'react';
import { adminAvatarsApi } from '../../../api/adminAvatarsApi';

export function useAdminAvatarsApi() {
  const list = useCallback((pageNumber = 1, pageSize = 20, search = '') => adminAvatarsApi.list(pageNumber, pageSize, search), []);
  const create = useCallback((payload: Parameters<typeof adminAvatarsApi.create>[0]) => adminAvatarsApi.create(payload), []);
  const update = useCallback((id: string, payload: Parameters<typeof adminAvatarsApi.update>[1]) => adminAvatarsApi.update(id, payload), []);
  const remove = useCallback((id: string) => adminAvatarsApi.remove(id), []);
  return { list, create, update, remove };
}
