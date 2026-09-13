import { useAuth } from '@/contexts/AuthProvider';
import { useUserState } from '@/contexts/UserStateContext';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import { queryClient } from '@/utils/queryClient';
import { useEffect, useRef } from 'react';
import { syncEntitlementToLocal } from '@/features/subscription/services/subscription.service';

export function useSubscriptionEntitlementSync(enabled: boolean) {
  const { user, isAuthenticated } = useAuth();
  const { updateState } = useUserState();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !user?.id) {
      syncedUserIdRef.current = null;
      return;
    }

    const isLocalDevMode =
      String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';
    if (isLocalDevMode) return;

    const userId = user.id;
    if (syncedUserIdRef.current === userId) return;
    syncedUserIdRef.current = userId;

    const run = async () => {
      const entitlement = await syncEntitlementToLocal(userId);
      if (syncedUserIdRef.current !== userId) return;
      if (!entitlement) {
        syncedUserIdRef.current = null;
        return;
      }

      await updateState((current) => ({
        subscription: {
          ...current.subscription,
          isPremium: !!entitlement.isPremium,
          planId: entitlement.planId ?? undefined,
          startedAt: entitlement.startedAt ?? undefined,
          expiresAt: entitlement.expiresAt ?? undefined,
          autoRenew: entitlement.autoRenew,
          status: (entitlement.status as any) ?? undefined,
        },
      }));

      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
    };

    void run();
  }, [enabled, isAuthenticated, updateState, user?.id]);
}
