import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createLearningStyles, learningLayout } from '../theme/learningTheme';

export function LearningIconButton({ icon, label, onPress, disabled = false, busy = false, variant = 'plain' }: {
  icon: ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void;
  disabled?: boolean; busy?: boolean; variant?: 'plain' | 'outlined';
}) {
  const { styles, theme } = useStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress} pressedStyle={{ backgroundColor: theme.controlPressed }} style={[styles.button, variant === 'outlined' && styles.outlined]}>
    <Ionicons name={icon} size={24} color={disabled ? theme.inkMuted : theme.violetDeep} />
  </AnimatedPressable>;
}
const useStyles = createLearningStyles(theme => ({
  button: { width: learningLayout.touchTarget, height: learningLayout.touchTarget, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: learningLayout.iconRadius },
  outlined: { backgroundColor: theme.paper, borderColor: theme.line, borderWidth: learningLayout.borderWidth },
}));
