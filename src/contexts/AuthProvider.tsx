import { User } from '@/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const AUTH_STORAGE_KEY = '@memopal_auth_user';

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Jing Yi',
  email: 'jingyi@test.com',
  isPremium: false,
  avatar: undefined,
  level: 1,
  xp: 10,
  streak: 1,
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /** Load user from local storage */
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

  /** Mock login */
  const login = async () => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(MOCK_USER));
    setUser(MOCK_USER);
  };

  /** Guest mode (no user, offline only) */
  const continueAsGuest = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    //setUser(null);
  };

  /** Logout */
  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    //setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        continueAsGuest,
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
