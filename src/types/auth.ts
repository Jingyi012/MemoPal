export type UserRole = 'User' | 'Admin';

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role?: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
