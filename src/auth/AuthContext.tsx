import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorageKey } from '../lib/apiClient';
import type { AuthUser } from '../types/auth';

function readRoleFromJwt(token: string): 'User' | 'Admin' | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? payload.role;
    return role === 'Admin' ? 'Admin' : role === 'User' ? 'User' : undefined;
  } catch {
    return undefined;
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(tokenStorageKey);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authApi.me();
        setUser({ ...profile, role: profile.role ?? readRoleFromJwt(token) });
      } catch {
        localStorage.removeItem(tokenStorageKey);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'Admin',
      login: async (email, password) => {
        const auth = await authApi.login(email, password);
        localStorage.setItem(tokenStorageKey, auth.token);
        setUser({ ...auth.user, role: auth.user.role ?? readRoleFromJwt(auth.token) });
      },
      logout: () => {
        localStorage.removeItem(tokenStorageKey);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
