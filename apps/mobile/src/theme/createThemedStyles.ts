import { useColorScheme } from 'nativewind';
import { memopalThemes, type MemoPalTheme } from './memopalTheme';

/** Build both palettes once; each consumer subscribes to theme changes. */
export function createThemedStyles<T>(createStyles: (theme: MemoPalTheme) => T) {
  const variants = {
    light: { theme: memopalThemes.light, styles: createStyles(memopalThemes.light) },
    dark: { theme: memopalThemes.dark, styles: createStyles(memopalThemes.dark) },
  };
  return function useThemedStyles() {
    const { colorScheme } = useColorScheme();
    return variants[colorScheme ?? 'light'];
  };
}
