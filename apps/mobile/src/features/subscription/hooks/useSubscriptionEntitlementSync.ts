import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import { queryClient } from '@/utils/queryClient';
import { useEffect } from 'react';
import { syncEntitlementToLocal } from '@/features/subscription/services/subscription.service';

export function useSubscriptionEntitlementSync(enabled: boolean) {
  const { user, isAuthenticated } = useAuth();
  const { updateState, userState } = useUserState();

  useEffect(() => {
    if (!enabled || !isAuthenticated || !user?.id) return;

    const isLocalDevMode =
      String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';
    if (isLocalDevMode) return;

    const run = async () => {
      const entitlement = await syncEntitlementToLocal(user.id);
      if (!entitlement) return;

      await updateState({
        subscription: {
          ...userState.subscription,
          isPremium: !!entitlement.isPremium,
          planId: entitlement.planId ?? undefined,
          startedAt: entitlement.startedAt ?? undefined,
          expiresAt: entitlement.expiresAt ?? undefined,
          autoRenew: entitlement.autoRenew,
          status: (entitlement.status as any) ?? undefined,
        },
      });

      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
    };

    run();
  }, [enabled, isAuthenticated, updateState, user?.id, userState.subscription]);
}
