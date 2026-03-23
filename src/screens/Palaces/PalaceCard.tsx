import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { Palace } from '@/types/palace';
import { CheckCircle2, Crown, Lock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface PalaceCardProps {
  palace: Palace;
  isCompleted: boolean;
  isDisabled?: boolean;
  onPress: (palace: Palace) => void;
}

export const PalaceCard: React.FC<PalaceCardProps> = ({
  palace,
  isCompleted,
  isDisabled = false,
  onPress,
}) => {
  return (
    <AnimatedPressable
      onPress={() => onPress(palace)}
      disabled={isDisabled}
      className="mb-4 w-full overflow-hidden rounded-2xl shadow-sm">
      <View className="relative h-44">
        <AppImage
          source={{ uri: palace.thumbnail }}
          className={`h-full w-full ${palace.isLocked ? 'brightness-75' : ''}`}
          contentFit="cover"
        />

        {/* Completed Badge */}
        {isCompleted && !palace.isLocked && (
          <View className="absolute right-3 top-3 rounded-full bg-green-500 p-2">
            <CheckCircle2 size={20} color="white" />
          </View>
        )}

        {/* Info */}
        {!palace.isLocked && (
          <View className="absolute bottom-0 left-0 right-0 items-center bg-black/70 p-5">
            <Text className="text-lg text-white">{palace.name}</Text>
            <Text className="text-sm text-white/90">
              {palace.locationsCount > 0 ? `${palace.locationsCount} locations` : 'Create your own'}
            </Text>
          </View>
        )}

        {/* Lock Overlay */}
        {palace.isLocked && (
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
                  {palace.locationsCount > 0
                    ? `${palace.locationsCount} locations`
                    : 'Create your own'}
                </Text>
                <Text className="text-sm text-white/90">{`Requires Level ${palace.level}`}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};
