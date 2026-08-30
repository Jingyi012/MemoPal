import { useCallback } from 'react';
import { adminUsersApi } from '../../../api/adminUsersApi';

export function useAdminUsersApi() {
  const listUsers = useCallback(
    (pageNumber = 1, pageSize = 20, search = '', includeDeleted = false) =>
      adminUsersApi.list(pageNumber, pageSize, search, includeDeleted),
    [],
  );

  const createUser = useCallback(
    (payload: Parameters<typeof adminUsersApi.create>[0]) =>
      adminUsersApi.create(payload),
    [],
  );

  const updateUser = useCallback(
    (
      userId: Parameters<typeof adminUsersApi.update>[0],
      payload: Parameters<typeof adminUsersApi.update>[1],
    ) => adminUsersApi.update(userId, payload),
    [],
  );

  const deleteUser = useCallback(
    (userId: Parameters<typeof adminUsersApi.remove>[0]) =>
      adminUsersApi.remove(userId),
    [],
  );

  return {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
