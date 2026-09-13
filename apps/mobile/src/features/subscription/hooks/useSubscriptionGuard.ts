import { useUserState } from '@/contexts/UserStateContext';
import { useEffect } from 'react';

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function useSubscriptionGuard(enabled: boolean) {
  const { userState, updateState } = useUserState();
  const { isPremium, expiresAt } = userState.subscription;

  useEffect(() => {
    if (!enabled) return;

    const run = async () => {
      const expired = isExpired(expiresAt);
      const shouldDowngrade = isPremium && expired;
      if (!shouldDowngrade) return;

      await updateState((current) => ({
        subscription: {
          ...current.subscription,
          isPremium: false,
          status: 'canceled',
          autoRenew: false,
        },
      }));
    };

    void run();
  }, [enabled, expiresAt, isPremium, updateState]);
}
