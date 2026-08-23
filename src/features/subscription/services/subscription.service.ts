import { billingApi } from '@/features/subscription/api/billing';
import { createUserRepository } from '@/features/profile/repositories/user.repo';
import { SubscriptionEntitlement } from '@/features/subscription/types/subscription';

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
