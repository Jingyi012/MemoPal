import { User } from '@/types/users';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (req: LoginRequest) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

export interface AuthResponse {
  token: string;
  user: User;
}
