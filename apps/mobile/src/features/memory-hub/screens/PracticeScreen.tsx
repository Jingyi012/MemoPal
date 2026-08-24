import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useEnabledMemoryModules } from '@/core/memory';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Brain, Hash, MapPinned, Plus, RefreshCcw, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PracticeScreen() {
  const router = useRouter();
  const modules = useEnabledMemoryModules();
  const memorySets = useMemorySets();
  const recentSets = useMemo(
    () => (memorySets.data ?? []).filter((memorySet) => memorySet.status !== 'archived').slice(0, 4),
    [memorySets.data]
  );

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Practice"
        title="Choose how to memorize"
        description="Pick a technique or jump back into a session"
        hideBackButton
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedPressable onPress={() => router.push('/create-memory' as Href)} style={styles.newSessionCard}>
          <Text style={styles.newSessionEmoji}>➕</Text>
          <Text style={styles.newSessionTitle}>New session</Text>
          <Text style={styles.newSessionBody}>Add your content, then we’ll suggest a technique</Text>
          <View style={styles.newSessionAction}>
            <Text style={styles.newSessionActionText}>Start with a list</Text>
            <ArrowRight size={16} color={theme.ink} />
          </View>
        </AnimatedPressable>

        <Text style={styles.sectionLabel}>Jump straight to a technique</Text>
        <View style={styles.techniqueRow}>
          {modules.map((module) => {
            const isPeg = module.key === 'number-peg';
            return (
              <AnimatedPressable
                key={module.key}
                onPress={() => router.push(module.route as Href)}
                style={styles.techniqueJump}>
                <View style={[styles.techniqueJumpIcon, isPeg ? styles.pegBackground : styles.palaceBackground]}>
                  {isPeg ? <Hash size={25} color={theme.berryDeep} /> : <MapPinned size={25} color={theme.violetDeep} />}
                </View>
                <Text style={styles.techniqueJumpName}>{module.title}</Text>
                <Text style={styles.techniqueJumpLink}>Skip to this →</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Recent sessions</Text>
          <AnimatedPressable onPress={() => router.push('/(tabs)/library' as Href)}>
            <Text style={styles.seeAll}>See all →</Text>
          </AnimatedPressable>
        </View>

        {memorySets.isLoading ? (
          <View style={styles.emptyCard}><Text style={styles.emptyBody}>Opening your recent sessions…</Text></View>
        ) : memorySets.isError ? (
          <View style={styles.emptyCard}>
            <RefreshCcw size={22} color={theme.inkSoft} />
            <Text style={styles.emptyTitle}>Your sessions are out of reach</Text>
            <Text style={styles.emptyBody}>Check your connection and try again.</Text>
            <AnimatedPressable onPress={() => memorySets.refetch()} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : recentSets.length ? (
          <View style={styles.sessionList}>
            {recentSets.map((memorySet) => (
              <RecentSessionCard
                key={memorySet.id}
                memorySet={memorySet}
                onPress={() => openMemorySet(router, memorySet)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Sparkles size={24} color={theme.sunDeep} />
            <Text style={styles.emptyTitle}>Your first memory starts here</Text>
            <Text style={styles.emptyBody}>Add a small list and turn it into a tiny movie or a walk through a room.</Text>
            <AnimatedPressable onPress={() => router.push('/create-memory' as Href)} style={styles.smallButton}>
              <Plus size={15} color="white" />
              <Text style={styles.smallButtonText}>Create memory</Text>
            </AnimatedPressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RecentSessionCard({ memorySet, onPress }: { memorySet: MemorySet; onPress: () => void }) {
  const isPeg = memorySet.techniqueKey === 'number-peg';
  return (
    <AnimatedPressable onPress={onPress} style={styles.sessionCard}>
      <View style={[styles.sessionBadge, isPeg ? styles.pegBackground : styles.palaceBackground]}>
        {isPeg ? <Hash size={20} color={theme.berryDeep} /> : <Brain size={20} color={theme.violetDeep} />}
      </View>
      <View style={styles.sessionMeta}>
        <Text numberOfLines={1} style={styles.sessionTitle}>{memorySet.title}</Text>
        <Text style={styles.sessionSubtitle}>{memorySet.items.length} items · {formatUpdatedAt(memorySet.updatedAt)}</Text>
      </View>
      <Text style={styles.sessionTechnique}>{isPeg ? 'PEG' : 'PALACE'}</Text>
      <ArrowRight size={16} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

function openMemorySet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push((memorySet.techniqueKey === 'palace' ? `/palaces/memory/${memorySet.id}` : `/number-peg/${memorySet.id}`) as Href);
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
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 42 },
  newSessionCard: { borderRadius: 20, borderWidth: 2, borderColor: '#FFE6A3', backgroundColor: '#FFF7E0', padding: 18, alignItems: 'center', shadowColor: theme.ink, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  newSessionEmoji: { fontSize: 30 },
  newSessionTitle: { color: theme.ink, fontSize: 17, fontWeight: '900', marginTop: 7 },
  newSessionBody: { color: theme.inkSoft, fontSize: 12.5, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  newSessionAction: { minHeight: 36, borderRadius: 11, backgroundColor: theme.sun, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  newSessionActionText: { color: theme.ink, fontSize: 12, fontWeight: '900' },
  sectionLabel: { color: theme.inkSoft, fontSize: 13, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  techniqueRow: { flexDirection: 'row', gap: 10 },
  techniqueJump: { flex: 1, minHeight: 135, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 12, alignItems: 'center' },
  techniqueJumpIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pegBackground: { backgroundColor: '#FFF0F4' },
  palaceBackground: { backgroundColor: '#EEE9FF' },
  techniqueJumpName: { color: theme.ink, fontSize: 12.5, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  techniqueJumpLink: { color: theme.sky, fontSize: 10.5, fontWeight: '900', marginTop: 3 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  seeAll: { color: theme.sky, fontSize: 11.5, fontWeight: '900', marginTop: 22 },
  sessionList: { gap: 10 },
  sessionCard: { minHeight: 70, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionBadge: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sessionMeta: { flex: 1, minWidth: 0 },
  sessionTitle: { color: theme.ink, fontSize: 13.5, fontWeight: '900' },
  sessionSubtitle: { color: theme.inkSoft, fontSize: 11.5, fontWeight: '700', marginTop: 3 },
  sessionTechnique: { color: theme.grass, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 },
  emptyCard: { borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 20, alignItems: 'center' },
  emptyTitle: { color: theme.ink, fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  emptyBody: { color: theme.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  smallButton: { minHeight: 38, borderRadius: 11, backgroundColor: theme.ink, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  smallButtonText: { color: 'white', fontSize: 12, fontWeight: '900' },
});
