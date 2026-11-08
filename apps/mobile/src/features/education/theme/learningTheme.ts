import { useColorScheme } from 'nativewind';
import { memopalThemes } from '@/theme/memopalTheme';
import { learningColors } from './learningTokens';
import { typography } from '@/theme/typography';
export { learningLayout, learningTypeScale, learningDocumentColors } from './learningTokens';

export const learningPalettes = { light: { ...memopalThemes.light, ...learningColors.light }, dark: { ...memopalThemes.dark, ...learningColors.dark } };
export type LearningPalette = typeof learningPalettes.light | typeof learningPalettes.dark;

export const learningTypography = { ...typography, display: 'Nunito_900Black', displayExtraBold: 'Nunito_900Black' };

export function createLearningStyles<T>(create: (palette: LearningPalette) => T) {
  const variants = { light: { theme: learningPalettes.light, styles: create(learningPalettes.light) }, dark: { theme: learningPalettes.dark, styles: create(learningPalettes.dark) } };
  return function useLearningThemedStyles() {
    const { colorScheme } = useColorScheme();
    return variants[colorScheme ?? 'light'];
  };
}
