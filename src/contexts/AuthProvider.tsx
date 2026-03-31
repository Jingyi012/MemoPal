import { ApiClientError, authApi, RegisterRequest } from '@/api/auth';
import { AUTH_STORAGE_KEY } from '@/constants/auth';
import { USER_STATE_STORAGE_KEY } from '@/constants/storage';
import { clearLocalCacheOnLogout } from '@/db/seed';
import { CURRENT_USER_KEYS } from '@/hooks/useCurrentUser';
import { createUserRepository } from '@/repositories/user.repo';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/services/user.service';
import { LoginRequest } from '@/types/auth';
import { User } from '@/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userRepo = useMemo(() => createUserRepository(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const normalizeUser = useCallback((candidate: Partial<User> | null | undefined): User | null => {
    if (!candidate?.id || !candidate.displayName) {
      return null;
    }

    return {
      ...candidate,
      id: candidate.id,
      displayName: candidate.displayName,
      email: candidate.email ?? 'player@example.com',
      avatarUrl: candidate.avatarUrl ?? undefined,
      totalXp: Math.max(0, candidate.totalXp ?? 0),
      level: Math.max(1, candidate.level ?? 1),
      isPremium: !!candidate.isPremium,
    };
  }, []);

  const loadCachedSessionUser = useCallback(async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<User>;
        const normalized = normalizeUser(parsed);
        if (normalized) {
          return normalized;
        }
      } catch {
        // Ignore malformed cache and fallback to local db user.
      }
    }

    const localCurrent = await userRepo.getCurrent();
    if (!localCurrent) {
      return null;
    }

    const localProfile = await userRepo.getProfileLocal(localCurrent.id);
    return normalizeUser(localProfile ?? null);
  }, [normalizeUser, userRepo]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          await Promise.allSettled([
            AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STATE_STORAGE_KEY]),
            clearAuthTokens(),
            clearLocalCacheOnLogout({ preserveSystemSettings: true }),
          ]);
          setUser(null);
          return;
        }

        const cachedUser = await loadCachedSessionUser();
        if (cachedUser) {
          setUser(cachedUser);
        }

        try {
          const remoteUser = await authApi.getCurrentProfile();
          await Promise.all([
            AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(remoteUser)),
            userRepo.upsertFromRemote(remoteUser),
          ]);
          setUser(remoteUser);
          await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
        } catch (error) {
          const statusCode = (error as ApiClientError | undefined)?.statusCode;
          const shouldInvalidateSession = statusCode === 401 || statusCode === 403;

          if (shouldInvalidateSession) {
            await Promise.allSettled([
              AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STATE_STORAGE_KEY]),
              clearAuthTokens(),
              clearLocalCacheOnLogout({ preserveSystemSettings: true }),
            ]);
            await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
            setUser(null);
            return;
          }

          if (cachedUser) {
            // Offline mode: keep last known authenticated user.
            setUser(cachedUser);
            return;
          }

          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [loadCachedSessionUser, queryClient, userRepo]);

  const setSession = async (sessionUser: User, token: string, refreshToken: string) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser)),
      setAccessToken(token),
      setRefreshToken(refreshToken),
      userRepo.upsertFromRemote(sessionUser),
    ]);
    setUser(sessionUser);
    await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
  };

  const login = async (req: LoginRequest) => {
    const auth = await authApi.login(req);
    await setSession(auth.user, auth.token, auth.refreshToken);
  };

  const register = async (req: RegisterRequest) => {
    const auth = await authApi.register(req);
    await setSession(auth.user, auth.token, auth.refreshToken);
  };

  const loginWithGoogle = async (idToken: string) => {
    const auth = await authApi.googleLogin(idToken);
    await setSession(auth.user, auth.token, auth.refreshToken);
  };

  const loginWithFacebook = async (accessToken: string) => {
    const auth = await authApi.facebookLogin(accessToken);
    await setSession(auth.user, auth.token, auth.refreshToken);
  };

  const logout = async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken });
      } catch {
        // Continue with local sign-out even when server-side revoke fails.
      }
    }

    await Promise.allSettled([
      AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STATE_STORAGE_KEY]),
      clearAuthTokens(),
      clearLocalCacheOnLogout({ preserveSystemSettings: true }),
    ]);
    setUser(null);
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
