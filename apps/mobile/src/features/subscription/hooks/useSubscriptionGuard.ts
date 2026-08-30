import { useUserState } from '@/contexts/UserStateContext';
import { useEffect } from 'react';

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function useSubscriptionGuard(enabled: boolean) {
  const { userState, updateState } = useUserState();

  useEffect(() => {
    if (!enabled) return;

    const run = async () => {
      const expired = isExpired(userState.subscription.expiresAt);
      const shouldDowngrade = userState.subscription.isPremium && expired;
      if (!shouldDowngrade) return;

      await updateState({
        subscription: {
          ...userState.subscription,
          isPremium: false,
          status: 'canceled',
          autoRenew: false,
        },
      });
    };

    run();
  }, [enabled, userState.subscription, updateState]);
}
