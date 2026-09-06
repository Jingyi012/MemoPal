import { useTranslation } from '@/core/i18n/useTranslation';
import type { AppTheme } from '@/features/onboarding/types/userState';
import { memopalThemes } from '@/theme/memopalTheme';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { useColorScheme } from 'nativewind';
import { PreferenceSelectionSheet } from './PreferenceSelectionSheet';

type Ref = BottomSheetModal;

type ThemeSheetProps = {
  currentTheme: AppTheme;
  onSave: (theme: AppTheme) => void | Promise<void>;
};

const THEME_OPTIONS: {
  key: AppTheme;
  emoji: string;
  titleKey: 'light' | 'dark' | 'systemTheme';
  bodyKey: 'lightThemeBody' | 'darkThemeBody' | 'systemThemeBody';
}[] = [
  { key: 'auto', emoji: '📱', titleKey: 'systemTheme', bodyKey: 'systemThemeBody' },
  { key: 'light', emoji: '🌞', titleKey: 'light', bodyKey: 'lightThemeBody' },
  { key: 'dark', emoji: '🌙', titleKey: 'dark', bodyKey: 'darkThemeBody' },
];

const ThemeSheet = forwardRef<Ref, ThemeSheetProps>(({ currentTheme, onSave }, ref) => {
  const { t } = useTranslation('profile');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];

  return (
    <PreferenceSelectionSheet
      ref={ref}
      title={t('chooseTheme')}
      description={t('themeDescription')}
      currentValue={currentTheme}
      options={THEME_OPTIONS.map((option, index) => ({
        key: option.key,
        emoji: option.emoji,
        title: t(option.titleKey),
        description: t(option.bodyKey),
        tint: [activeTheme.sunTint, activeTheme.violetTint, activeTheme.skyTint][index],
      }))}
      onSelect={(value) => onSave(value as AppTheme)}
    />
  );
});

ThemeSheet.displayName = 'ThemeSheet';

export default ThemeSheet;
