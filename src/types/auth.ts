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
  logout: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;
