import { vars } from 'nativewind';
import { memopalThemes, type MemoPalTheme } from '@/theme/memopalTheme';

export type ThemeMode = keyof typeof memopalThemes;

const toNativewindPalette = (theme: MemoPalTheme) => ({
  primary: theme.sun,
  primaryHover: theme.sunDeep,
  primaryActive: theme.berryDeep,
  primaryLight: theme.sunTint,
  secondary: theme.violetDeep,
  bg: theme.canvas,
  surface: theme.paper,
  text: theme.ink,
  textMuted: theme.inkSoft,
  textSubtle: theme.inkMuted,
  border: theme.line,
  disabled: theme.disabled,
  tint: theme.sky,
  sun: theme.sun,
  berry: theme.berry,
  violet: theme.violet,
  grass: theme.grass,
  sky: theme.sky,
  sunTint: theme.sunTint,
  berryTint: theme.berryTint,
  violetTint: theme.violetTint,
  mintTint: theme.mintTint,
  skyTint: theme.skyTint,
  peachTint: theme.peachTint,
  sunLine: theme.sunLine,
  berryLine: theme.berryLine,
  violetLine: theme.violetLine,
  mintLine: theme.mintLine,
  skyLine: theme.skyLine,
  peachLine: theme.peachLine,
  cardBgPrimary: theme.peachTint,
  cardBgSecondary: theme.berryTint,
  cardBorder: theme.line,
});

// NativeWind adapter only. All actual color values live in memopalTheme.ts.
const nativewindPalettes = {
  light: toNativewindPalette(memopalThemes.light),
  dark: toNativewindPalette(memopalThemes.dark),
} as const;

// 2. Helper to transform raw keys to CSS variable format
// Converts 'primaryHover' -> '--color-primary-hover'
const createVars = (mode: ThemeMode) => {
  const raw = nativewindPalettes[mode];
  const transformed: Record<string, string> = {};

  Object.entries(raw).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS
    const cssKey = `--color-${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
    transformed[cssKey] = value;
  });

  return vars(transformed);
};

// 3. Exported NativeWind variables for your ThemeProvider/Root View
export const nativewindThemes = {
  light: createVars('light'),
  dark: createVars('dark'),
};
