import { StyleSheet } from 'react-native';
import { Text, View } from 'react-native';
import { Clock, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ReviewDueBadgeProps {
  dueCount: number;
  overdueCount: number;
  onPress: () => void;
}

export const ReviewDueBadge: React.FC<ReviewDueBadgeProps> = ({
  dueCount,
  overdueCount,
  onPress,
}) => {
  if (dueCount === 0 && overdueCount === 0) return null;

  const hasOverdue = overdueCount > 0;
  const primaryCount = hasOverdue ? overdueCount : dueCount;
  const label = hasOverdue ? 'Overdue' : 'Ready to Review';
  const bgColor = hasOverdue ? 'bg-red-100' : 'bg-amber-100';
  const borderColor = hasOverdue ? 'border-red-400' : 'border-amber-400';
  const textColor = hasOverdue ? 'text-red-900' : 'text-amber-900';
  const icon = hasOverdue ? AlertCircle : Clock;
  const Icon = icon;

  return (
    <Animated.View
      entering={FadeInDown.delay(100)}
      className={`mb-4 overflow-hidden rounded-2xl ${bgColor}`}>
      <View
        onTouchEnd={onPress}
        className={`flex-row items-center justify-between border-l-4 ${borderColor} px-4 py-3`}>
        <View className="flex-row items-center gap-3">
          <Icon size={24} color={hasOverdue ? '#b91c1c' : '#b45309'} />
          <View>
            <Text className={`text-sm font-bold ${textColor}`}>{label}</Text>
            <Text className={`text-xs ${textColor} opacity-80`}>
              {primaryCount} lesson{primaryCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <Text className={`text-lg font-bold ${textColor}`}>→</Text>
      </View>
    </Animated.View>
  );
};
