export interface AdminUserSubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  provider: string;
  providerReference?: string | null;
  status: string;
  startedAt: string;
  expiresAt?: string | null;
  autoRenew: boolean;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateSubscriptionRequest {
  status?: string;
  expiresAt?: string;
  autoRenew?: boolean;
  lastVerifiedAt?: string;
}
