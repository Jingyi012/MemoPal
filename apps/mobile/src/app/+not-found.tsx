import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles } from '@/theme/designSystem';
import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function NotFoundScreen() {
  const { t } = useTranslation('notFound');
  return (
    <>
      <Stack.Screen options={{ title: t('title') }} />
      <View className="flex-1 items-center justify-center gap-3">
        <Text style={appTextStyles.pageTitle}>{t('title')}</Text>
        <View className="h-2" />
        <Link href="/">
          <Text>{t('home')}</Text>
        </Link>
      </View>
    </>
  );
}
