import { vars } from 'nativewind';

export type ThemeMode = 'light' | 'dark';

// 1. Define the Raw Hex Codes (Source of Truth)
// Using camelCase keys here makes it easier to access in JS: theme.primaryLight
export const rawPalettes = {
  light: {
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryActive: '#115e59',
    primaryLight: '#ccfbf1',
    secondary: '#4f46e5',
    bg: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    tint: '#0a7ea4',

    cardBgPrimary: '#faf5ff',
    cardBgSecondary: '#fdf2f8',
    cardBorder: '#e9d5ff',
  },
  dark: {
    primary: '#0d9488',
    primaryHover: '#5eead4',
    primaryActive: '#14b8a6',
    primaryLight: '#134e4a',
    secondary: '#4f46e5',
    bg: '#111827',
    surface: '#1f2937',
    text: '#f3f4f6',
    textMuted: '#9ca3af',
    border: '#374151',
    tint: '#fff',

    cardBgPrimary: '#1f2937',
    cardBgSecondary: '#2c2f3a',
    cardBorder: '#374151',
  },
} as const;

// 2. Helper to transform raw keys to CSS variable format
// Converts 'primaryHover' -> '--color-primary-hover'
const createVars = (mode: ThemeMode) => {
  const raw = rawPalettes[mode];
  const transformed: Record<string, string> = {};

  Object.entries(raw).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS
    const cssKey = `--color-${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
    transformed[cssKey] = value;
  });

  return vars(transformed);
};

// 3. Exported NativeWind variables for your ThemeProvider/Root View
export const palettes = {
  light: createVars('light'),
  dark: createVars('dark'),
};
