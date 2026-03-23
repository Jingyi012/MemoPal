import { apiClient } from '../lib/apiClient';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type {
  AdminReferralRecordDto,
  AdminReferralUserDto,
  ReferralProgramConfigDto,
} from '../types/referral';

export const adminReferralsApi = {
  getConfig(): Promise<ReferralProgramConfigDto> {
    return apiClient
      .get<ApiResponse<ReferralProgramConfigDto>>('/admin/referrals/config')
      .then((r) => r.data.data);
  },

  updateConfig(config: ReferralProgramConfigDto): Promise<ReferralProgramConfigDto> {
    return apiClient
      .put<ApiResponse<ReferralProgramConfigDto>>('/admin/referrals/config', { config })
      .then((r) => r.data.data);
  },

  listUsers(pageNumber = 1, pageSize = 20, search = ''): Promise<PaginatedResponse<AdminReferralUserDto>> {
    return apiClient
      .get<PaginatedResponse<AdminReferralUserDto>>('/admin/referrals/users', {
        params: { pageNumber, pageSize, search: search || undefined },
      })
      .then((r) => r.data);
  },

  listRecords(
    pageNumber = 1,
    pageSize = 20,
    search = '',
    referrerUserId?: string
  ): Promise<PaginatedResponse<AdminReferralRecordDto>> {
    return apiClient
      .get<PaginatedResponse<AdminReferralRecordDto>>('/admin/referrals/records', {
        params: {
          pageNumber,
          pageSize,
          search: search || undefined,
          referrerUserId: referrerUserId || undefined,
        },
      })
      .then((r) => r.data);
  },
};
