import { defaultUserState, LessonProgress, UserState } from '@/types/userState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const USER_STATE_KEY = '@memopal_user_state';

type UserStateContextType = {
  userState: UserState;
  updateState: (updates: Partial<UserState>) => Promise<void>;
  updatePreferences: (updates: Partial<UserState['preferences']>) => Promise<void>;
  updateLessonProgress: (lessonId: string, updates: Partial<LessonProgress>) => Promise<void>;
  resetState: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const UserStateContext = createContext<UserStateContextType | undefined>(undefined);

export const UserStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserState>(defaultUserState);

  // Load from storage on app start
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STATE_KEY);
        if (stored) setState(JSON.parse(stored));
      } catch (err) {
        console.warn('Failed to load user state:', err);
      }
    };
    loadState();
  }, []);

  // Save state helper
  const saveState = async (newState: UserState) => {
    setState(newState);
    await AsyncStorage.setItem(USER_STATE_KEY, JSON.stringify(newState));
  };

  // Update full or partial state
  const updateState = async (updates: Partial<UserState>) => {
    const newState = { ...state, ...updates };
    await saveState(newState);
  };

  // Update only preferences
  const updatePreferences = async (updates: Partial<UserState['preferences']>) => {
    const newState = { ...state, preferences: { ...state.preferences, ...updates } };
    await saveState(newState);
  };

  // Update lesson progress
  const updateLessonProgress = async (lessonId: string, updates: Partial<LessonProgress>) => {
    const existing = state.lessonsProgress[lessonId] || {};
    const newState = {
      ...state,
      lessonsProgress: {
        ...state.lessonsProgress,
        [lessonId]: { ...existing, ...updates },
      },
    };
    await saveState(newState);
  };

  const resetState = async () => {
    await saveState(defaultUserState);
  };

  const completeOnboarding = async () => {
    await updateState({
      hasCompletedOnboarding: true,
      isFirstTime: false,
      preferences: {
        ...state.preferences,
      },
    });
  };

  return (
    <UserStateContext.Provider
      value={{
        userState: state,
        updateState,
        updatePreferences,
        updateLessonProgress,
        resetState,
        completeOnboarding,
      }}>
      {children}
    </UserStateContext.Provider>
  );
};

// Hook
export const useUserState = () => {
  const context = useContext(UserStateContext);
  if (!context) throw new Error('useUserState must be used within UserStateProvider');
  return context;
};
