import { appRadii } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type HighlightCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Shared light surface for the most important summary card on a screen. */
export function HighlightCard({ children, style }: HighlightCardProps) {
  const { styles } = useStyles();

  return (
    <View style={[styles.card, style]}>
      <View accessible={false} pointerEvents="none" style={styles.orb} />
      <View accessible={false} pointerEvents="none" style={styles.sparkle} />
      {children}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: appRadii.card,
    borderWidth: 1,
    borderColor: theme.violetLine,
    backgroundColor: theme.paper,
    padding: 18,
    boxShadow: '0px 5px 16px rgba(43,42,61,0.08)',
  },
  orb: {
    position: 'absolute',
    top: -46,
    right: -20,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: theme.violetTint,
    opacity: 0.72,
  },
  sparkle: {
    position: 'absolute',
    top: 55,
    right: 30,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.sun,
    opacity: 0.8,
  },
}));
