import { languageOptions } from '@/core/i18n/i18n';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AppLanguage } from '@/features/onboarding/types/userState';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { PreferenceSelectionSheet } from './PreferenceSelectionSheet';

type LanguageSheetProps = {
  currentLanguage: AppLanguage;
  onSave: (language: AppLanguage) => void | Promise<void>;
};

export const LanguageSheet = forwardRef<BottomSheetModal, LanguageSheetProps>(
  ({ currentLanguage, onSave }, ref) => {
    const { t } = useTranslation('language');
    const options = languageOptions.map((option) => ({
      key: option.key,
      emoji: option.emoji,
      title: option.key === 'system' ? t('followSystem') : option.key === 'zh' ? t('chinese') : t('english'),
      description: option.key === 'system' ? t('useDeviceLanguage') : option.key === 'zh' ? t('chineseInterface') : t('englishInterface'),
      tint: option.key === 'system' ? theme.skyTint : option.key === 'zh' ? theme.berryTint : theme.sunTint,
    }));

    return (
      <PreferenceSelectionSheet
        ref={ref}
        title={t('title')}
        description={t('description')}
        currentValue={currentLanguage}
        options={options}
        onSelect={(value) => onSave(value as AppLanguage)}
      />
    );
  }
);

LanguageSheet.displayName = 'LanguageSheet';
