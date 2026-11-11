import type { LucideIcon } from '@/core/icons';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { appLayout, appRadii } from '@/theme/designSystem';

type Props = {
  icon?: LucideIcon;
  accessibilityLabel: string;
  onPress?: () => void;
  children?: ReactNode;
  disabled?: boolean;
  selected?: boolean;
};

export function HeaderIconButton({ icon: Icon, accessibilityLabel, onPress, children, disabled = false, selected = false }: Props) {
  const { theme, styles } = useStyles();
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} pressedStyle={{ backgroundColor: theme.controlPressed }} style={[styles.button, disabled && { opacity: 0.45 }]}>
      {Icon ? <Icon size={21} strokeWidth={2.2} color={theme.violetDeep} fill={selected ? theme.violetDeep : 'none'} /> : null}
      {children}
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  button: {
    width: appLayout.touchTarget,
    height: appLayout.touchTarget,
    borderRadius: appRadii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
