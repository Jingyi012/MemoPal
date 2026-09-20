import api from '@/core/api/apiClient';
import { GeneralResponse } from '@/core/types/general';
import { SubscriptionEntitlement } from '@/features/subscription/types/subscription';

export const billingApi = {
  async getEntitlement(): Promise<SubscriptionEntitlement> {
    const response = await api.get<GeneralResponse<SubscriptionEntitlement>>('/billing/entitlement');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async cancelSubscription(): Promise<SubscriptionEntitlement> {
    const response = await api.post<GeneralResponse<SubscriptionEntitlement>>('/billing/cancel');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
