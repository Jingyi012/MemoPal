import { useCallback } from 'react';
import { adminSystemSettingsApi } from '../../../api/adminSystemSettingsApi';

export function useAdminSystemSettingsApi() {
  const listSystemSettings = useCallback(
    (pageNumber = 1, pageSize = 20, key = '') =>
      adminSystemSettingsApi.list(pageNumber, pageSize, key),
    [],
  );

  const upsertSystemSetting = useCallback(
    (payload: Parameters<typeof adminSystemSettingsApi.upsert>[0]) =>
      adminSystemSettingsApi.upsert(payload),
    [],
  );

  return {
    listSystemSettings,
    upsertSystemSetting,
  };
}
