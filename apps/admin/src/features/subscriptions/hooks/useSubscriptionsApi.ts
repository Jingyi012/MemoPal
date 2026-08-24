import { useCallback } from 'react';
import { adminSubscriptionsApi } from '../../../api/adminSubscriptionsApi';

export function useSubscriptionsApi() {
  const listSubscriptions = useCallback(
    (pageNumber = 1, pageSize = 20, search = '', status = '') =>
      adminSubscriptionsApi.list(pageNumber, pageSize, search, status),
    [],
  );

  const updateSubscription = useCallback(
    (
      subscriptionId: Parameters<typeof adminSubscriptionsApi.update>[0],
      payload: Parameters<typeof adminSubscriptionsApi.update>[1],
    ) => adminSubscriptionsApi.update(subscriptionId, payload),
    [],
  );

  return {
    listSubscriptions,
    updateSubscription,
  };
}
