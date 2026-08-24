import AnimatedPressable from '@/components/AnimatedPressable';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { ArrowRight } from 'lucide-react-native';
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
      <AnimatedPressable
        accessibilityLabel={actionLabel}
        onPress={onAction}
        style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        <ArrowRight size={19} color={theme.ink} />
      </AnimatedPressable>
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
  heroEyebrow: { color: '#E3DFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: 'white', fontSize: 25, fontWeight: '900', marginTop: 6 },
  heroBody: { color: '#E8E5F4', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 320 },
  primaryButton: { marginTop: 20, minHeight: 52, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 14, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  primaryButtonText: { color: theme.ink, fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
});
