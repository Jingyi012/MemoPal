import { User } from '@/features/profile/types/users';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginMethods {
  emailPassword: boolean;
  google: boolean;
  facebook: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (req: LoginRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

export interface AuthResponse {
  token: string;
  tokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  user: User;
}
