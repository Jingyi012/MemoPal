import { billingApi } from '@/features/subscription/api/billing';
import { SubscriptionEntitlement } from '@/features/subscription/types/subscription';

export async function syncEntitlementToLocal(_userId?: string): Promise<SubscriptionEntitlement | null> {
  try {
    return await billingApi.getEntitlement();
  } catch {
    return null;
  }
}
