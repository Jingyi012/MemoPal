import { Check, Crown, Lock } from 'lucide-react-native';
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
      className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-slate-50' : ''}`}>
      <View className="flex-row items-center">
        <View
          className={`mr-4 h-9 w-9 items-center justify-center rounded-full ${isCompleted ? 'bg-green-100' : 'bg-slate-50'}`}>
          {isAwarded ? <Check size={18} color="#16a34a" /> : <Lock size={18} color="#cbd5e1" />}
        </View>
        <View>
          <Text className={`text-sm font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{title}</Text>
          <Text className='text-xs text-slate-500'>{rewardLabel}</Text>
          <Text className="text-xs text-slate-400">{refs} Friends required</Text>
        </View>
      </View>
      {isAwarded && <Crown size={18} color="#f59e0b" />}
    </View>
  );
};
