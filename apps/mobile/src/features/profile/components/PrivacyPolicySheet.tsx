import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { usePrivacyPolicyConfig } from '@/features/profile/hooks/usePrivacyPolicyConfig';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Constants from 'expo-constants';
import { forwardRef } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Ref = BottomSheetModal;

const PrivacyPolicySheet = forwardRef<Ref>((_, ref) => {
  const insets = useSafeAreaInsets();
  const { config } = usePrivacyPolicyConfig();
  const { t } = useTranslation('profile');
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = Platform.select({
    android: Constants.platform?.android?.versionCode?.toString(),
    ios: Constants.platform?.ios?.buildNumber ?? undefined,
    default: undefined,
  }) ?? 'dev';
  const buildEnvironment = String(
    Constants.expoConfig?.extra?.buildEnvironment ?? 'development',
  ).toLowerCase();
  const buildEnvironmentLabel =
    buildEnvironment === 'prod' || buildEnvironment === 'production'
      ? t('environmentProduction')
      : buildEnvironment === 'uat' || buildEnvironment === 'preview'
        ? t('environmentUat')
        : t('environmentDevelopment');

  return (
    <CustomBottomSheetModal ref={ref} snapPoints={['95%']} enableDynamicSizing={false}>
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        {/* Header */}
        <Text className="mb-3 px-6 pt-4 text-xl font-bold">{config.title}</Text>

        {/* Scrollable Content */}
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          {config.sections.map((section, index) => (
            <View key={`${index}-${section.heading}`} className="mb-3">
              <Text className="mb-2 text-lg font-semibold text-[#2B2A3D]">{section.heading}</Text>
              <Text className="text-sm text-[#6B6A80]">{section.body}</Text>
            </View>
          ))}

          <View className="mt-2 rounded-3xl border border-[#E9E3D5] bg-[#FFFDF8] p-4">
            <Text className="mb-3 text-base font-bold text-[#2B2A3D]">
              {t('buildInformation')}
            </Text>
            <Text className="text-sm text-[#6B6A80]">
              {t('appVersion')} {appVersion}
            </Text>
            <Text className="mt-1 text-sm text-[#6B6A80]">
              {t('buildNumber')} {buildNumber}
            </Text>
            <Text className="mt-1 text-sm text-[#6B6A80]">
              {t('buildEnvironment')} {buildEnvironmentLabel}
            </Text>
          </View>
        </BottomSheetScrollView>
      </View>
    </CustomBottomSheetModal>
  );
});

PrivacyPolicySheet.displayName = 'PrivacyPolicySheet';

export default PrivacyPolicySheet;
