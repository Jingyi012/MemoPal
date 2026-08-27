import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function NotFoundScreen() {
  const { t } = useTranslation('notFound');
  return (
    <>
      <Stack.Screen options={{ title: t('title') }} />
      <View className="flex-1 items-center justify-center gap-3">
        <Text className="text-2xl">{t('title')}</Text>
        <View className="h-2" />
        <Link href="/">
          <Text>{t('home')}</Text>
        </Link>
      </View>
    </>
  );
}
