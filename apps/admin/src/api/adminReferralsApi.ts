import { apiClient } from "../lib/apiClient";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  ReferralRecordView,
  ReferralUserView,
  ReferralProgramConfigDto,
} from "../types/referral";

export const adminReferralsApi = {
  async getConfig(): Promise<ReferralProgramConfigDto> {
    const r = await apiClient.get<ApiResponse<ReferralProgramConfigDto>>(
      "/admin/referrals/config",
    );
    return r.data.data;
  },

  async updateConfig(
    config: ReferralProgramConfigDto,
  ): Promise<ReferralProgramConfigDto> {
    const r = await apiClient.put<ApiResponse<ReferralProgramConfigDto>>(
      "/admin/referrals/config",
      { config },
    );
    return r.data.data;
  },

  async listUsers(
    pageNumber = 1,
    pageSize = 20,
    search = "",
  ): Promise<PaginatedResponse<ReferralUserView>> {
    const r = await apiClient.get<PaginatedResponse<ReferralUserView>>(
      "/admin/referrals/users",
      {
        params: { pageNumber, pageSize, search: search || undefined },
      },
    );
    return r.data;
  },

  async listRecords(
    pageNumber = 1,
    pageSize = 20,
    search = "",
    referrerUserId?: string,
  ): Promise<PaginatedResponse<ReferralRecordView>> {
    const r = await apiClient.get<PaginatedResponse<ReferralRecordView>>(
      "/admin/referrals/records",
      {
        params: {
          pageNumber,
          pageSize,
          search: search || undefined,
          referrerUserId: referrerUserId || undefined,
        },
      },
    );
    return r.data;
  },
};
