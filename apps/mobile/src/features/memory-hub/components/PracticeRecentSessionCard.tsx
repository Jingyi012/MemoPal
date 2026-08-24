import AnimatedPressable from '@/components/AnimatedPressable';
import type { MemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { ArrowRight, Brain, Hash } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export function PracticeRecentSessionCard({ memorySet, onPress }: { memorySet: MemorySet; onPress: () => void }) {
  const isPeg = memorySet.techniqueKey === 'number-peg';
  return (
    <AnimatedPressable onPress={onPress} style={styles.card}>
      <View style={[styles.badge, isPeg ? styles.pegBackground : styles.palaceBackground]}>
        {isPeg ? <Hash size={20} color={theme.berryDeep} /> : <Brain size={20} color={theme.violetDeep} />}
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{memorySet.title}</Text>
        <Text style={styles.subtitle}>{memorySet.items.length} items · {formatUpdatedAt(memorySet.updatedAt)}</Text>
      </View>
      <Text style={styles.technique}>{isPeg ? 'PEG' : 'PALACE'}</Text>
      <ArrowRight size={16} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

function formatUpdatedAt(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Ready to practice';
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Updated ${days}d ago`;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 2, flexDirection: 'row', gap: 10, minHeight: 70, padding: 11 },
  badge: { alignItems: 'center', borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  pegBackground: { backgroundColor: '#FFF0F4' },
  palaceBackground: { backgroundColor: '#EEE9FF' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13.5 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11.5, marginTop: 3 },
  technique: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.5 },
});
