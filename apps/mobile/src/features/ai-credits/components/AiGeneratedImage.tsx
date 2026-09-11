import { ActivityIndicator, Image, View } from 'react-native';
import { CreditText as Text } from './CreditText';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import AnimatedPressable from '@/components/AnimatedPressable';
import { aiCreditsApi } from '../api/aiCredits.api';

export function AiGeneratedImage({ path, description }: { path: string; description: string }) {
  const { user } = useAuth();
  const { language } = useTranslation('numberPeg');
  const query = useQuery({
    queryKey: ['ai-image', user?.id, path], queryFn: () => aiCreditsApi.image(path),
    enabled: Boolean(user), gcTime: 0, meta: { persist: false },
  });
  if (query.isPending) return <ActivityIndicator accessibilityLabel="Loading illustration" />;
  if (query.isError) return <AnimatedPressable onPress={() => void query.refetch()} style={{ minHeight: 44, padding: 12 }}>
    <Text>{language === 'zh' ? '图片加载失败，点击重试' : 'Image unavailable. Tap to retry.'}</Text>
  </AnimatedPressable>;
  return <View style={{ width: '100%', marginVertical: 12 }}>
    <Image source={{ uri: query.data }} accessibilityLabel={description} accessible resizeMode="contain"
      style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }} />
  </View>;
}
