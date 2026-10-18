import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authSessionExpiredEventName,
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAuthSession,
} from "../lib/apiClient";
import type { AuthUser } from "../types/auth";
import { useAuthApi } from "./useAuthApi";

function readRoleFromJwt(token: string): "User" | "Admin" | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const role =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload.role;
    return role === "Admin" ? "Admin" : role === "User" ? "User" : undefined;
  } catch {
    return undefined;
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login: loginApi, me, logout: logoutApi } = useAuthApi();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = getStoredAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await me();
        setUser({ ...profile, role: profile.role ?? readRoleFromJwt(token) });
      } catch {
        clearStoredAuthSession();
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [me]);

  useEffect(() => {
    const handleAuthSessionExpired = () => {
      clearStoredAuthSession();
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(
      authSessionExpiredEventName,
      handleAuthSessionExpired,
    );
    return () => {
      window.removeEventListener(
        authSessionExpiredEventName,
        handleAuthSessionExpired,
      );
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "Admin",
      login: async (email, password) => {
        const auth = await loginApi(email, password);
        setStoredAuthSession({
          token: auth.token,
          refreshToken: auth.refreshToken,
        });
        const authenticatedUser = {
          ...auth.user,
          role: auth.user.role ?? readRoleFromJwt(auth.token),
        };
        setUser(authenticatedUser);
        return authenticatedUser;
      },
      logout: () => {
        const refreshToken = getStoredRefreshToken();
        if (refreshToken) {
          void logoutApi(refreshToken).catch(() => undefined);
        }

        clearStoredAuthSession();
        setUser(null);
      },
    }),
    [user, loading, loginApi, logoutApi],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
