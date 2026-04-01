import { useCallback } from 'react';
import { adminReferralsApi } from '../../../api/adminReferralsApi';

export function useAdminReferralsApi() {
  const getConfig = useCallback(() => adminReferralsApi.getConfig(), []);

  const updateConfig = useCallback(
    (payload: Parameters<typeof adminReferralsApi.updateConfig>[0]) =>
      adminReferralsApi.updateConfig(payload),
    [],
  );

  const listReferralUsers = useCallback(
    (pageNumber = 1, pageSize = 20, search = '') =>
      adminReferralsApi.listUsers(pageNumber, pageSize, search),
    [],
  );

  const listReferralRecords = useCallback(
    (
      pageNumber = 1,
      pageSize = 20,
      search = '',
      referrerUserId?: string,
    ) =>
      adminReferralsApi.listRecords(pageNumber, pageSize, search, referrerUserId),
    [],
  );

  return {
    getConfig,
    updateConfig,
    listReferralUsers,
    listReferralRecords,
  };
}
