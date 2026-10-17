import type { LucideIcon } from '@/core/icons';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';

type Props = {
  icon?: LucideIcon;
  accessibilityLabel: string;
  onPress?: () => void;
  children?: ReactNode;
};

export function HeaderIconButton({ icon: Icon, accessibilityLabel, onPress, children }: Props) {
  const { theme, styles } = useStyles();
  return (
    <AnimatedPressable accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.button}>
      {Icon ? <Icon size={21} strokeWidth={2.2} color={theme.violetDeep} /> : null}
      {children}
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.violetLine,
    backgroundColor: theme.violetTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
