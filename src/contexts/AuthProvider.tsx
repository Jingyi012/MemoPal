import { authApi, RegisterRequest } from '@/api/auth';
import { AUTH_STORAGE_KEY, MOCK_USER } from '@/constants/auth';
import { resetSeedData, seedInitialData } from '@/db/seed';
import { clearAccessToken, setAccessToken } from '@/services/user.service';
import { LoginRequest } from '@/types/auth';
import { User } from '@/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithFacebook: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const isLocalDevMode = __DEV__ || process.env.EXPO_PUBLIC_LOCAL_DEV_MODE === 'true';

  const setSession = async (sessionUser: User, token: string) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser)),
      setAccessToken(token),
    ]);
    setUser(sessionUser);
  };

  const setMockSession = async () => {
    await setSession(MOCK_USER, 'local-dev-token');
  };

  const login = async (req: LoginRequest) => {
    if (isLocalDevMode) {
      await setMockSession();
      return;
    }

    const auth = await authApi.login(req);
    await setSession(auth.user, auth.token);
  };

  const register = async (req: RegisterRequest) => {
    if (isLocalDevMode) {
      await setMockSession();
      return;
    }

    const auth = await authApi.register(req);
    await setSession(auth.user, auth.token);
  };

  const loginWithGoogle = async (accessToken: string) => {
    if (isLocalDevMode) {
      await setMockSession();
      return;
    }

    const auth = await authApi.googleLogin(accessToken);
    await setSession(auth.user, auth.token);
  };

  const loginWithFacebook = async (accessToken: string) => {
    if (isLocalDevMode) {
      await setMockSession();
      return;
    }

    const auth = await authApi.facebookLogin(accessToken);
    await setSession(auth.user, auth.token);
  };

  const logout = async () => {
    await AsyncStorage.clear();
    await clearAccessToken();
    await resetSeedData();
    await seedInitialData(true);
    setUser(null);
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
