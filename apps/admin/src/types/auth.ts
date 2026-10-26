export type UserRole = 'User' | 'Admin';

export interface AuthUser {
  id: string;
  accountMode?: 'Standard' | 'RestrictedLearner';
  displayName: string;
  email: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  tokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  user: AuthUser;
}
