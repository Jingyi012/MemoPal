import { Colors } from '@/constants/colors';
import { Flame } from 'lucide-react-native';
import { Text, View } from 'react-native';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <View
      className="mt-3 flex-row items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5"
      style={{ alignSelf: 'flex-start' }}>
      <Flame size={16} color={Colors.orange500} fill={Colors.orange400} />
      <Text className="text-sm text-white">{streak} day streak!</Text>
    </View>
  );
}
