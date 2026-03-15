import { billingApi } from '@/api/billing';
import { createUserRepository } from '@/repositories/user.repo';
import { SubscriptionEntitlement } from '@/types/subscription';

const userRepo = createUserRepository();

export async function syncEntitlementToLocal(userId: string): Promise<SubscriptionEntitlement | null> {
  try {
    const entitlement = await billingApi.getEntitlement();
    await userRepo.setPremium(userId, !!entitlement.isPremium);
    return entitlement;
  } catch {
    return null;
  }
}
