import { BaseCard } from '@/components/BaseCard';
import { Step } from '@/core/types/application';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface StepCardProps {
  step: Step;
}

export const StepCard: React.FC<StepCardProps> = ({ step }) => {
  const isLocked = step.isLocked ?? false;
  const progressPercent = step.progress ? (step.progress.current / step.progress.total) * 100 : 0;

  return (
    <BaseCard
      className={`mt-3 p-4 ${isLocked ? 'opacity-60' : ''}`}
      padding="none"
      shadow="md">
      <View className="flex-row items-start gap-4">
        {/* Circle */}
        {isLocked ? (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F6F3EA]">
            <Text className="text-[#6B6A80]">{step.id}</Text>
          </View>
        ) : (
          <LinearGradient
            colors={[theme.violetDeep, theme.berryDeep]}
            className="h-12 w-12 items-center justify-center"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
            }}>
            <Text className="text-white">{step.id}</Text>
          </LinearGradient>
        )}

        {/* Content */}
        <View className="flex-1">
          <Text
            className={`mb-1 ${isLocked ? 'text-[#9A97A7]' : 'text-[#2B2A3D]'} flex-row items-center`}>
            {step.title}
            {isLocked && (
              <Text className="ml-2 rounded-full bg-[#F6F3EA] px-2 py-0.5 text-xs text-[#6B6A80]">
                Locked
              </Text>
            )}
          </Text>
          <Text className="mb-2 text-sm text-[#6B6A80]">
            {step.description}
          </Text>

          {/* Progress bar */}
          {step.progress && !isLocked && (
            <View className="flex-row items-center gap-2">
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEE9DC]">
                <View
                  className="h-full rounded-full bg-[#3FB87F]"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
              <Text className="text-xs text-[#6B6A80]">
                {step.progress.current}/{step.progress.total}
              </Text>
            </View>
          )}
        </View>
      </View>
    </BaseCard>
  );
};
