import AnimatedPressable from '@/components/AnimatedPressable';
import { CheckCircle2, Crown, Lock } from 'lucide-react-native';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface PalaceCardProps {
  palace: {
    id: string;
    name: string;
    locations: number;
    thumbnail: string;
    locked: boolean;
    requiredXP: number;
    isPremium: boolean;
  };
  isCompleted: boolean;
  userXP: number;
  onPress: (palaceId: string) => void;
}

export const PalaceCard: React.FC<PalaceCardProps> = ({ palace, isCompleted, userXP, onPress }) => {
  return (
    <AnimatedPressable
      onPress={() => onPress(palace.id)}
      disabled={palace.locked && !palace.isPremium}
      className="mb-4 w-full overflow-hidden rounded-2xl shadow-sm">
      <View className="relative h-44">
        <Image
          source={{ uri: palace.thumbnail }}
          className={`h-full w-full ${palace.locked ? 'brightness-75' : ''}`}
          resizeMode="cover"
        />

        {/* Completed Badge */}
        {isCompleted && !palace.locked && (
          <View className="absolute right-3 top-3 rounded-full bg-green-500 p-2">
            <CheckCircle2 size={20} color="white" />
          </View>
        )}

        {/* Info */}
        {!palace.locked && (
          <View className="absolute bottom-0 left-0 right-0 items-center bg-black/70 p-5">
            <Text className="text-lg text-white">{palace.name}</Text>
            <Text className="text-sm text-white/90">
              {palace.locations > 0 ? `${palace.locations} locations` : 'Create your own'}
            </Text>
          </View>
        )}

        {/* Lock Overlay */}
        {palace.locked && (
          <View className="absolute inset-0 items-center justify-center bg-black/60 px-6">
            {palace.isPremium ? (
              <>
                <Crown size={40} color="#FACC15" className="mb-3" />
                <Text className="text-lg text-white">{palace.name}</Text>
                <Text className="text-sm text-yellow-400">Premium Only</Text>
              </>
            ) : (
              <>
                <Lock size={40} color="white" className="mb-3" />
                <Text className="text-lg text-white">{palace.name}</Text>
                <Text className="text-sm text-white/90">
                  {palace.locations > 0 ? `${palace.locations} locations` : 'Create your own'}
                </Text>
                <Text className="text-sm text-white/90">{`Requires ${palace.requiredXP} XP`}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};
