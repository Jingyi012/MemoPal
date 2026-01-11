import { Check, Crown, Lock } from 'lucide-react-native';
import { Text, View } from 'react-native';

interface Props {
  refs: number;
  reward: string;
  current: number;
  isLast?: boolean;
}

export const MilestoneRow: React.FC<Props> = ({ refs, reward, current, isLast }) => {
  const isCompleted = current >= refs;
  return (
    <View
      className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-slate-50' : ''}`}>
      <View className="flex-row items-center">
        <View
          className={`mr-4 h-9 w-9 items-center justify-center rounded-full ${isCompleted ? 'bg-green-100' : 'bg-slate-50'}`}>
          {isCompleted ? <Check size={18} color="#16a34a" /> : <Lock size={18} color="#cbd5e1" />}
        </View>
        <View>
          <Text
            className={`text-sm font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
            {reward}
          </Text>
          <Text className="text-xs text-slate-400">{refs} Friends required</Text>
        </View>
      </View>
      {isCompleted && <Crown size={18} color="#f59e0b" />}
    </View>
  );
};
