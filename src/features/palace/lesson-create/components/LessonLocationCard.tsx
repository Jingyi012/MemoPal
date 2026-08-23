import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { LessonWordForm } from '@/features/palace/shared/types/lesson.types';
import { Location } from '@/features/palace/shared/types/palace.types';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Props {
  location: Location;
  word?: LessonWordForm;
  onPress: () => void;
}

export function LessonLocationCard({ location, word, onPress }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={{ width: '48.5%', marginBottom: 12 }}
      className="relative overflow-hidden rounded-2xl shadow-sm">
      <AppImage source={{ uri: location.imageUrl }} className="w-full" style={{ height: 144 }} />
      <View className="absolute inset-0 rounded-2xl bg-black/20" />
      <View className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1">
        <Text className="text-xs font-medium text-white">{location.name}</Text>
      </View>
      {word && (
        <Animated.View
          entering={FadeIn}
          className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/60 p-2">
          <Text className="text-base font-bold text-white">{word.text}</Text>
          {word.meaning && <Text className="text-xs text-white/80">{word.meaning}</Text>}
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}
