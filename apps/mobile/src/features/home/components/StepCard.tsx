import { BaseCard } from '@/components/BaseCard';
import { Step } from '@/core/types/application';
import { memopalTheme as theme } from '@/theme/memopalTheme';
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
          <View className="h-12 w-12 items-center justify-center rounded-full bg-tint-sky">
            <Text className="text-ink-soft">{step.id}</Text>
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
            className={`mb-1 ${isLocked ? 'text-ink-muted' : 'text-ink'} flex-row items-center`}>
            {step.title}
            {isLocked && (
              <Text className="ml-2 rounded-full bg-tint-sky px-2 py-0.5 text-xs text-ink-soft">
                Locked
              </Text>
            )}
          </Text>
          <Text className="mb-2 text-sm text-ink-soft">
            {step.description}
          </Text>

          {/* Progress bar */}
          {step.progress && !isLocked && (
            <View className="flex-row items-center gap-2">
              <View className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <View
                  className="h-full rounded-full bg-accent-grass"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
              <Text className="text-xs text-ink-soft">
                {step.progress.current}/{step.progress.total}
              </Text>
            </View>
          )}
        </View>
      </View>
    </BaseCard>
  );
};
