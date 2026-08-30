import AnimatedPressable from '@/components/AnimatedPressable';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type MemorySetRowProps = {
  tone: 'peg' | 'palace';
  title: string;
  badgeText: string;
  subtitle: string;
  onPress: () => void;
};

export function MemorySetRow({ tone, title, badgeText, subtitle, onPress }: MemorySetRowProps) {
  const isPeg = tone === 'peg';
  return (
    <AnimatedPressable
      accessibilityLabel={`${title} ${subtitle}`}
      onPress={onPress}
      style={styles.card}>
      <View style={[styles.badge, isPeg ? styles.pegBadge : styles.palaceBadge]}>
        <Text style={[styles.badgeText, isPeg ? styles.pegText : styles.palaceText]}>{badgeText}</Text>
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 76, borderRadius: 18, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  badge: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pegBadge: { backgroundColor: '#FFF0F4' },
  palaceBadge: { backgroundColor: '#EEE9FF' },
  badgeText: { fontFamily: typography.display, fontSize: 18 },
  pegText: { color: theme.berryDeep },
  palaceText: { color: theme.violetDeep },
  meta: { flex: 1, marginHorizontal: 12 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, marginTop: 3 },
});
