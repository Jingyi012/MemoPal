import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { LessonWordForm } from '@/types/lesson';
import { Location } from '@/types/palace';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Props {
  location: Location;
  word?: LessonWordForm;
  onPress: () => void;
}

export function LocationCard({ location, word, onPress }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      className="relative w-[48%] overflow-hidden rounded-2xl shadow-sm">
      {/* Background Image */}
      <AppImage source={{ uri: location.imageUrl }} className="h-36 w-full" />

      {/* Overlay */}
      <View className="absolute inset-0 rounded-2xl bg-black/20" />

      {/* Location name (top-left corner) */}
      <View className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1">
        <Text className="text-xs font-medium text-white">{location.name}</Text>
      </View>

      {/* Word Card (above location name) */}
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
