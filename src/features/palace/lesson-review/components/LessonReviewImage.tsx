import { AppImage } from '@/components/AppImage';
import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type Props = {
  imageUrl?: string;
  isRevealed: boolean;
  feedback: 'correct' | 'wrong' | null;
};

export const ReviewImageDisplay: React.FC<Props> = ({ imageUrl, isRevealed, feedback }) => (
  <View className="aspect-square w-full overflow-hidden rounded-[40px] border-4 border-white bg-slate-200 shadow-xl">
    <AppImage source={{ uri: imageUrl }} className="h-full w-full" />
    {isRevealed && feedback === 'correct' && (
      <Animated.View
        entering={FadeIn}
        className="absolute inset-0 items-center justify-center bg-green-500/20">
        <View className="rounded-full bg-white p-4 shadow-lg">
          <Check size={40} color="#10b981" />
        </View>
      </Animated.View>
    )}
  </View>
);
