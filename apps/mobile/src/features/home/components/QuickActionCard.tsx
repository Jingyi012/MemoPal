import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import React from 'react';
import { StyleSheet } from 'react-native';

type QuickActionCardProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function QuickActionCard({ title, subtitle, onPress }: QuickActionCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: appSpacing.sm,
    borderRadius: appRadii.card,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: appSpacing.lg,
  },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, marginTop: 2 },
});
