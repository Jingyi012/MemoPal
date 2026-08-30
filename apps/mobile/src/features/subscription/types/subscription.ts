export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | string;

export interface SubscriptionEntitlement {
  isPremium: boolean;
  planId?: string | null;
  provider?: string | null;
  status?: SubscriptionStatus | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  autoRenew: boolean;
  lastVerifiedAt?: string | null;
}
