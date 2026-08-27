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
      className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-[#EEE9DC]' : ''}`}>
      <View className="flex-row items-center">
        <View
          className={`mr-4 h-9 w-9 items-center justify-center rounded-full ${isCompleted ? 'bg-[#F1FBF5]' : 'bg-[#F6F3EA]'}`}>
          <Text className="text-base">{isAwarded ? '✓' : '🔒'}</Text>
        </View>
        <View>
          <Text className={`text-sm font-bold ${isCompleted ? 'text-[#2B2A3D]' : 'text-[#9A97A7]'}`}>{title}</Text>
          <Text className="text-xs text-[#6B6A80]">{rewardLabel}</Text>
          <Text className="text-xs text-[#9A97A7]">{refs} Friends required</Text>
        </View>
      </View>
      {isAwarded && <Text className="text-lg">👑</Text>}
    </View>
  );
};
