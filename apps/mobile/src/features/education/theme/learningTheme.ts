import { useColorScheme } from 'nativewind';
import { memopalThemes, type MemoPalTheme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';

/** Color and type roles transcribed from docs/MemoPal 学习模块 UI 定调.html. */
export const learningPalettes = {
  light: {
    ...memopalThemes.light,
    ink: '#251F3D', inkSoft: '#59516F', inkMuted: '#706681',
    canvas: '#FBF8FF', paper: '#FFFFFF', line: '#E4DAFB',
    violetTint: '#F1ECFF', violetLine: '#E4DAFB', violetDeep: '#6B4FCF',
    // Slightly deeper ink than the mockup so small status labels pass AA.
    successText: '#1D784F', grass: '#4FB27C', mintTint: '#E6F7EE', mintLine: '#A9DEC2',
    berryDeep: '#BE304C', berryTint: '#FDEBEE', berryLine: '#F2B8C2',
    peachTint: '#FFF0D6', peachLine: '#FFE0A8',
    disabled: '#D9D3E6', onAccent: '#FFFFFF',
    isDark: false, primaryShadow: '#4C35A3', successShadow: '#17613F',
    disabledShadow: '#C2BAD6', memoryInk: '#5E1030',
    hero: ['#6B4FCF', '#9752B4'], memory: ['#FFD1DC', '#FF9DB5'],
    science: ['#F1ECFF', '#F1ECFF'], math: ['#F1ECFF', '#F1ECFF'], english: ['#F1ECFF', '#F1ECFF'],
    tools: ['#EDE7FF', '#DDD3FF'], challenge: ['#8FE6CF', '#4CC3B8'],
    toolsInk: '#4C35A3', challengeInk: '#05453F',
  },
  dark: {
    ...memopalThemes.dark,
    ink: '#F4EFFF', inkSoft: '#D0C7E8', canvas: '#1B152B', paper: '#2B233E', line: '#514365',
    violetTint: '#372B50', violetLine: '#63517D', violetDeep: '#BBA7FF',
    successText: '#82DFB0', mintTint: '#203E32', mintLine: '#3E7258',
    berryDeep: '#FF9AAE', berryTint: '#4B2637', berryLine: '#85435B',
    onAccent: '#251F3D', isDark: true, primaryShadow: '#7861B0', successShadow: '#28794F',
    disabledShadow: '#3D3351', memoryInk: '#FFE1EB',
    hero: ['#4E328D', '#723C83'], memory: ['#57283F', '#843A59'],
    science: ['#372B50', '#372B50'], math: ['#372B50', '#372B50'], english: ['#372B50', '#372B50'],
    tools: ['#EDE7FF', '#DDD3FF'], challenge: ['#214C42', '#2B746B'],
    toolsInk: '#4C35A3', challengeInk: '#E0FFF8',
  },
} satisfies Record<'light' | 'dark', MemoPalTheme & Record<string, unknown>>;

export type LearningPalette = typeof learningPalettes.light | typeof learningPalettes.dark;
export const learningTypography = { ...typography, display: 'Nunito_900Black', displayExtraBold: 'Nunito_900Black' };

export function createLearningStyles<T>(create: (palette: LearningPalette) => T) {
  const variants = { light: { theme: learningPalettes.light, styles: create(learningPalettes.light) }, dark: { theme: learningPalettes.dark, styles: create(learningPalettes.dark) } };
  return function useLearningThemedStyles() {
    const { colorScheme } = useColorScheme();
    return variants[colorScheme ?? 'light'];
  };
}
