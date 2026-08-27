import AnimatedPressable from '@/components/AnimatedPressable';
import { Home } from 'lucide-react-native';
import { Text } from 'react-native';
import { typography } from '@/theme/typography';

export function ReturnToTodayButton({
  onPress,
  label = 'Back to Home',
  accessibilityLabel = 'Return to Today',
}: {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        minHeight: 44,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
      }}>
      <Home size={16} color="#6B6A80" />
      <Text style={{ color: '#6B6A80', fontFamily: typography.bodyExtraBold, fontSize: 12.5 }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
