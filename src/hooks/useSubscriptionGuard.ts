import { useUserState } from '@/contexts/UserStateContext';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
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

      const user = await db.query.users.findFirst();
      if (user) {
        await db
          .update(schema.users)
          .set({ isPremium: false, updatedAt: new Date().toISOString() })
          .where(eq(schema.users.id, user.id));
      }

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
