import { USER_STATE_STORAGE_KEY } from '@/core/storage/constants';
import { defaultUserState, UserState } from '@/features/onboarding/types/userState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type UserStateUpdate = Partial<UserState> | ((current: UserState) => Partial<UserState>);

type UserStateContextType = {
  userState: UserState;
  updateState: (updates: UserStateUpdate) => Promise<void>;
  updatePreferences: (updates: Partial<UserState['preferences']>) => Promise<void>;
  resetState: () => Promise<void>;
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
  const saveState = useCallback(async (newState: UserState) => {
    stateRef.current = newState;
    setState(newState);
    await AsyncStorage.setItem(USER_STATE_STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const waitForHydration = useCallback(async () => {
    if (!hydratedRef.current) await hydrationPromiseRef.current;
  }, []);

  // Update full or partial state
  const updateState = useCallback(async (updates: UserStateUpdate) => {
    await waitForHydration();
    const currentState = stateRef.current;
    const resolvedUpdates = typeof updates === 'function' ? updates(currentState) : updates;
    const newState = { ...currentState, ...resolvedUpdates };
    if (JSON.stringify(newState) === JSON.stringify(currentState)) return;
    await saveState(newState);
  }, [saveState, waitForHydration]);

  // Update only preferences
  const updatePreferences = useCallback(async (updates: Partial<UserState['preferences']>) => {
    await waitForHydration();
    const currentState = stateRef.current;
    const newState = { ...currentState, preferences: { ...currentState.preferences, ...updates } };
    if (JSON.stringify(newState.preferences) === JSON.stringify(currentState.preferences)) return;
    await saveState(newState);
  }, [saveState, waitForHydration]);

  const resetState = useCallback(async () => {
    await waitForHydration();
    await saveState({ ...defaultUserState, lastVisitDate: new Date().toISOString() });
  }, [saveState, waitForHydration]);

  const contextValue = useMemo(() => ({
    userState: state,
    updateState,
    updatePreferences,
    resetState,
  }), [resetState, state, updatePreferences, updateState]);

  return (
    <UserStateContext.Provider value={contextValue}>
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
