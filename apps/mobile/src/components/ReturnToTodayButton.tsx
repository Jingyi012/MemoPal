import AnimatedPressable from '@/components/AnimatedPressable';
import { Home } from 'lucide-react-native';
import { Text } from 'react-native';

export function ReturnToTodayButton({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Return to Today"
      onPress={onPress}
      style={{ minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      <Home size={16} color="#6B6A80" />
      <Text style={{ color: '#6B6A80', fontSize: 12.5, fontWeight: '800' }}>Back to Today</Text>
    </AnimatedPressable>
  );
}
