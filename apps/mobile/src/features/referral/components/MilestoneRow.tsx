import { Text, View } from 'react-native';

interface Props {
  title: string;
  refs: number;
  rewardLabel: string;
  current: number;
  isAwarded: boolean;
  isLast?: boolean;
}

export const MilestoneRow: React.FC<Props> = ({ title, refs, rewardLabel, current, isAwarded, isLast }) => {
  const isCompleted = current >= refs;
  return (
    <View
      className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-line' : ''}`}>
      <View className="flex-1 flex-row items-center">
        <View
              className={`mr-4 h-9 w-9 items-center justify-center rounded-full ${isCompleted ? 'bg-tint-mint' : 'bg-tint-violet'}`}>
          <Text className="text-base">{isAwarded ? '✓' : '🔒'}</Text>
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-bold ${isCompleted ? 'text-ink' : 'text-ink-soft'}`}>{title}</Text>
          <Text className="text-xs text-ink-soft">{rewardLabel}</Text>
          <Text className="text-xs text-ink-soft">{refs} Friends required</Text>
        </View>
      </View>
      {isAwarded && <Text className="text-lg">👑</Text>}
    </View>
  );
};
