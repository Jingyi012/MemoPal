import { useColorScheme } from 'nativewind';
import { learningColors } from './learningTokens';
import { typography } from '@/theme/typography';
export { learningLayout, learningTypeScale, learningDocumentColors } from './learningTokens';

export const learningPalettes = learningColors;
export type LearningPalette = typeof learningPalettes.light | typeof learningPalettes.dark;

export const learningTypography = typography;

export function createLearningStyles<T>(create: (palette: LearningPalette) => T) {
  const variants = { light: { theme: learningPalettes.light, styles: create(learningPalettes.light) }, dark: { theme: learningPalettes.dark, styles: create(learningPalettes.dark) } };
  return function useLearningThemedStyles() {
    const { colorScheme } = useColorScheme();
    return variants[colorScheme ?? 'light'];
  };
}
