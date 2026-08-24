import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { RedeemReferralResult, ReferralSummary } from '@/features/referral/types/referral';

export const referralApi = {
  async getMySummary(): Promise<ReferralSummary> {
    const response = await api.get<GeneralResponse<ReferralSummary>>('/referrals/me');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to load referral summary');
    }
    return response.data.data;
  },

  async redeem(code: string): Promise<RedeemReferralResult> {
    const response = await api.post<GeneralResponse<RedeemReferralResult>>('/referrals/redeem', { code });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to redeem referral code');
    }
    return response.data.data;
  },
};
