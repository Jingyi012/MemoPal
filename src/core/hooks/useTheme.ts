import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme as nativeUseColorScheme } from 'react-native';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'user-theme';

const useTheme = (): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} => {
  const systemColorScheme = nativeUseColorScheme();
  const [theme, setThemeState] = useState<Theme>('light');

  // Load user preference from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeState(storedTheme);
      } else {
        // fallback to system preference
        setThemeState(systemColorScheme ?? 'light');
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  // Save theme changes to AsyncStorage
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
};

export default useTheme;
