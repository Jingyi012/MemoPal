import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { AdminUpdateSubscriptionRequest, AdminUserSubscriptionDto } from '../types/subscription';

export const adminSubscriptionsApi = {
  list(pageNumber = 1, pageSize = 20, search = '', status = '') {
    return apiClient
      .get<PaginatedResponse<AdminUserSubscriptionDto>>('/admin/subscriptions', {
        params: { pageNumber, pageSize, search: search || undefined, status: status || undefined },
      })
      .then((r) => r.data);
  },

  update(subscriptionId: string, payload: AdminUpdateSubscriptionRequest) {
    return apiClient
      .patch<ApiResponse<AdminUserSubscriptionDto>>(`/admin/subscriptions/${subscriptionId}`, payload)
      .then((r) => r.data.data);
  },
};
