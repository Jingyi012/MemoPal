import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles } from '@/theme/designSystem';
import { View } from 'react-native';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <View
      className="mt-3 flex-row items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5"
      style={{ alignSelf: 'flex-start' }}>
      <Text style={appTextStyles.body}>🔥</Text>
      <Text className="text-white" style={appTextStyles.label}>{streak} day streak!</Text>
    </View>
  );
}
