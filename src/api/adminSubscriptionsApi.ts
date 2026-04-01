import { apiClient } from "../lib/apiClient";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  AdminUpdateSubscriptionRequest,
  AdminUserSubscriptionDto,
} from "../types/subscription";

export const adminSubscriptionsApi = {
  async list(pageNumber = 1, pageSize = 20, search = "", status = "") {
    const r = await apiClient.get<PaginatedResponse<AdminUserSubscriptionDto>>(
      "/admin/subscriptions",
      {
        params: {
          pageNumber,
          pageSize,
          search: search || undefined,
          status: status || undefined,
        },
      },
    );
    return r.data;
  },

  async update(
    subscriptionId: string,
    payload: AdminUpdateSubscriptionRequest,
  ) {
    const r = await apiClient.patch<ApiResponse<AdminUserSubscriptionDto>>(
      `/admin/subscriptions/${subscriptionId}`,
      payload,
    );
    return r.data.data;
  },
};
