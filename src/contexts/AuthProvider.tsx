import { authApi, RegisterRequest } from '@/api/auth';
import { AUTH_STORAGE_KEY } from '@/constants/auth';
import { CURRENT_USER_KEYS } from '@/hooks/useCurrentUser';
import { createUserRepository } from '@/repositories/user.repo';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/services/user.service';
import { LoginRequest } from '@/types/auth';
import { User } from '@/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

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
  const queryClient = useQueryClient();
  const userRepo = useMemo(() => createUserRepository(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
          return;
        }

        try {
          const remoteUser = await authApi.getCurrentProfile();
          await Promise.all([
            AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(remoteUser)),
            userRepo.upsertFromRemote(remoteUser),
          ]);
          setUser(remoteUser);
          await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
        } catch {
          await clearAccessToken();
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          await userRepo.clearLocalAuthUser();
          await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [queryClient, userRepo]);

  const setSession = async (sessionUser: User, token: string) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser)),
      setAccessToken(token),
      userRepo.upsertFromRemote(sessionUser),
    ]);
    setUser(sessionUser);
    await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
  };

  const login = async (req: LoginRequest) => {
    const auth = await authApi.login(req);
    await setSession(auth.user, auth.token);
  };

  const register = async (req: RegisterRequest) => {
    const auth = await authApi.register(req);
    await setSession(auth.user, auth.token);
  };

  const loginWithGoogle = async (accessToken: string) => {
    const auth = await authApi.googleLogin(accessToken);
    await setSession(auth.user, auth.token);
  };

  const loginWithFacebook = async (accessToken: string) => {
    const auth = await authApi.facebookLogin(accessToken);
    await setSession(auth.user, auth.token);
  };

  const logout = async () => {
    await AsyncStorage.clear();
    await Promise.all([clearAccessToken(), userRepo.clearLocalAuthUser()]);
    setUser(null);
    await queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
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
