import AnimatedPressable from '@/components/AnimatedPressable';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { languageOptions } from '@/core/i18n/i18n';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { AppLanguage } from '@/features/onboarding/types/userState';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';

type LanguageSheetProps = {
  currentLanguage: AppLanguage;
  onSave: (language: AppLanguage) => void | Promise<void>;
};

export const LanguageSheet = forwardRef<BottomSheetModal, LanguageSheetProps>(
  ({ currentLanguage, onSave }, ref) => {
    const { t } = useTranslation('language');
    return (
      <CustomBottomSheetModal ref={ref} snapPoints={['55%']} enableDynamicSizing={false}>
        <View className="px-6 pb-4 pt-3">
          <Text className="text-xl font-bold text-[#2B2A3D]">{t('title')}</Text>
          <Text className="mt-1 text-sm text-[#6B6A80]">{t('description')}</Text>
        </View>
        <View className="px-6">
          {languageOptions.map((option) => {
          const selected = option.key === currentLanguage;
          const label = option.key === 'system' ? t('followSystem') : option.key === 'zh' ? t('chinese') : t('english');
          const description = option.key === 'system' ? t('useDeviceLanguage') : option.key === 'zh' ? t('chineseInterface') : t('englishInterface');
          return (
            <AnimatedPressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={async () => {
                await onSave(option.key);
                if (ref && 'current' in ref) ref.current?.dismiss();
              }}
              className={`mb-3 flex-row items-center rounded-2xl border-2 p-4 ${
                selected ? 'border-[#DCD4FF] bg-[#EEE9FF]' : 'border-[#EEE9DC] bg-[#FFFDF8]'
              }`}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                <Text className="text-xl">{option.emoji}</Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-[#2B2A3D]">{label}</Text>
                <Text className="mt-0.5 text-sm text-[#6B6A80]">{description}</Text>
              </View>
              <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-[#7A68E0] bg-[#7A68E0]' : 'border-[#D8D4C9]'}`}>
                {selected ? <Text className="text-xs font-bold text-white">✓</Text> : null}
              </View>
            </AnimatedPressable>
          );
          })}
        </View>
        <Text className="px-6 pt-2 text-center text-xs font-semibold text-[#9A97A7]">
          {t('currentSelection')}: {currentLanguage === 'system' ? t('followSystem') : currentLanguage === 'zh' ? t('chinese') : t('english')}
        </Text>
      </CustomBottomSheetModal>
    );
  }
);

LanguageSheet.displayName = 'LanguageSheet';
