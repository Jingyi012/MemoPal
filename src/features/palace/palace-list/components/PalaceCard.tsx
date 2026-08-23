/** Temporary adapter for the existing palace card while presentation files are migrated. */
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { Palace } from '@/features/palace/shared/types/palace.types';
import { Crown, Lock } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface PalaceCardProps {
  palace: Palace;
  isDisabled?: boolean;
  onPress: (palace: Palace) => void;
  deletable?: boolean;
  onDelete?: (palace: Palace) => void;
}

export const PalaceCard: React.FC<PalaceCardProps> = ({
  palace,
  isDisabled = false,
  onPress,
  deletable = false,
  onDelete,
}) => {
  return (
    <AnimatedPressable
      onPress={() => onPress(palace)}
      onLongPress={() => {
        if (deletable && onDelete) {
          onDelete(palace);
        }
      }}
      delayLongPress={450}
      disabled={isDisabled}
      className="mb-4 w-full overflow-hidden rounded-2xl shadow-sm">
      <View className="relative h-44">
        <AppImage
          source={{ uri: palace.thumbnail }}
          className={`h-full w-full ${palace.isLocked ? 'brightness-75' : ''}`}
          contentFit="cover"
        />

        {!palace.isLocked && (
          <View className="absolute bottom-0 left-0 right-0 items-center bg-black/70 p-5">
            <Text className="text-lg text-white">{palace.name}</Text>
            <Text className="text-sm text-white/90">
              {palace.locationsCount > 0 ? `${palace.locationsCount} locations` : 'Create your own'}
            </Text>
          </View>
        )}

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
