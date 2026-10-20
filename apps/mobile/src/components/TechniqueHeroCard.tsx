import { AppButton } from '@/components/ui/AppButton';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { ArrowRight } from '@/core/icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type TechniqueHeroCardProps = {
  tone: 'peg' | 'palace';
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
};

export function TechniqueHeroCard({
  tone,
  icon,
  eyebrow,
  title,
  body,
  actionLabel,
  onAction,
}: TechniqueHeroCardProps) {
  const isPeg = tone === 'peg';
  return (
    <LinearGradient
      colors={isPeg ? [theme.night, theme.nightDeep] : ['#51479B', theme.night]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}>
      <View style={[styles.heroGlow, isPeg ? styles.pegGlow : styles.palaceGlow]} />
      <View style={[styles.heroIcon, isPeg ? styles.pegIcon : styles.palaceIcon]}>{icon}</View>
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroBody}>{body}</Text>
      <AppButton
        label={actionLabel}
        variant="primary"
        size="large"
        trailingIcon={ArrowRight}
        onPress={onAction}
        style={styles.primaryButton}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 26, padding: 20, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -60, top: -75 },
  pegGlow: { backgroundColor: 'rgba(255, 201, 60, 0.18)' },
  palaceGlow: { backgroundColor: 'rgba(184, 173, 255, 0.2)' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  pegIcon: { backgroundColor: theme.sun },
  palaceIcon: { backgroundColor: '#B9B1FF' },
  heroEyebrow: { color: '#E3DFFF', fontFamily: typography.bodyExtraBold, fontSize: 11, letterSpacing: 1.1 },
  heroTitle: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 25, marginTop: 6 },
  heroBody: { color: '#E8E5F4', fontFamily: typography.body, fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 320 },
  primaryButton: { marginTop: 20, alignSelf: 'stretch' },
});
