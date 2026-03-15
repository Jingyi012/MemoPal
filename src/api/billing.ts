import api from '@/api/api';
import { GeneralResponse } from '@/types/general';
import { SubscriptionEntitlement } from '@/types/subscription';

export const billingApi = {
  async getEntitlement(): Promise<SubscriptionEntitlement> {
    const response = await api.get<GeneralResponse<SubscriptionEntitlement>>('/billing/entitlement');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
};
