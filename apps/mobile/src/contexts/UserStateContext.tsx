import { USER_STATE_STORAGE_KEY } from '@/core/storage/constants';
import { defaultUserState, UserState } from '@/features/onboarding/types/userState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

type UserStateContextType = {
  userState: UserState;
  updateState: (updates: Partial<UserState>) => Promise<void>;
  updatePreferences: (updates: Partial<UserState['preferences']>) => Promise<void>;
  resetState: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const UserStateContext = createContext<UserStateContextType | undefined>(undefined);

export const UserStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UserState>(defaultUserState);
  const stateRef = useRef<UserState>(defaultUserState);
  const hydratedRef = useRef(false);
  const hydrationPromiseRef = useRef<Promise<void> | null>(null);

  // Load from storage on app start
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STATE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserState>;
          const hydratedState = {
            ...defaultUserState,
            ...parsed,
            ui: { ...defaultUserState.ui, ...(parsed.ui ?? {}) },
            preferences: { ...defaultUserState.preferences, ...(parsed.preferences ?? {}) },
            notifications: { ...defaultUserState.notifications, ...(parsed.notifications ?? {}) },
            subscription: { ...defaultUserState.subscription, ...(parsed.subscription ?? {}) },
          };
          stateRef.current = hydratedState;
          setState(hydratedState);
        }
      } catch (err) {
        console.warn('Failed to load user state:', err);
      } finally {
        hydratedRef.current = true;
      }
    };
    const hydration = loadState();
    hydrationPromiseRef.current = hydration;
  }, []);

  // Save state helper
  const saveState = async (newState: UserState) => {
    stateRef.current = newState;
    setState(newState);
    await AsyncStorage.setItem(USER_STATE_STORAGE_KEY, JSON.stringify(newState));
  };

  const waitForHydration = async () => {
    if (!hydratedRef.current) await hydrationPromiseRef.current;
  };

  // Update full or partial state
  const updateState = async (updates: Partial<UserState>) => {
    await waitForHydration();
    const currentState = stateRef.current;
    const newState = { ...currentState, ...updates };
    await saveState(newState);
  };

  // Update only preferences
  const updatePreferences = async (updates: Partial<UserState['preferences']>) => {
    await waitForHydration();
    const currentState = stateRef.current;
    const newState = { ...currentState, preferences: { ...currentState.preferences, ...updates } };
    await saveState(newState);
  };

  const resetState = async () => {
    await waitForHydration();
    await saveState({ ...defaultUserState, lastVisitDate: new Date().toISOString() });
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
