import AnimatedPressable from '@/components/AnimatedPressable';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

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
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 16,
  },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, marginTop: 2 },
});
