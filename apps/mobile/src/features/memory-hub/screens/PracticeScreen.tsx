import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useEnabledMemoryModules } from '@/core/memory';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Brain, Hash, MapPinned, Plus, RefreshCcw, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PracticeScreen() {
  const router = useRouter();
  const modules = useEnabledMemoryModules();
  const memorySets = useMemorySets();
  const palaceScenes = usePalaceScenes();
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

        <DiscoveryRow
          title="Your peg set"
          actionLabel="See all →"
          onAction={() => router.push('/number-peg' as Href)}
          items={PEG_ANCHORS.map((peg) => ({
            key: String(peg.number),
            title: `${peg.number}. ${peg.name}`,
            subtitle: peg.emoji,
            tone: 'peg' as const,
          }))}
          onItemPress={() => router.push('/number-peg' as Href)}
        />

        <DiscoveryRow
          title="Your palaces"
          actionLabel="See all →"
          onAction={() => router.push('/palaces' as Href)}
          items={(palaceScenes.data ?? []).slice(0, 4).map((scene) => ({
            key: scene.id,
            title: scene.name,
            subtitle: `${scene.loci.length} loci`,
            imageUrl: scene.imageUrl,
            tone: 'palace' as const,
          }))}
          onItemPress={(sceneId) =>
            router.push({ pathname: '/palaces/create-memory', params: { sceneId } })
          }
          emptyLabel={palaceScenes.isLoading ? 'Opening your palace shelf…' : 'Build your first palace'}
        />

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

type DiscoveryItem = {
  key: string;
  title: string;
  subtitle: string;
  tone: 'peg' | 'palace';
  imageUrl?: string | null;
};

function DiscoveryRow({
  title,
  actionLabel,
  onAction,
  items,
  onItemPress,
  emptyLabel,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  items: DiscoveryItem[];
  onItemPress: (key: string) => void;
  emptyLabel?: string;
}) {
  return (
    <View style={styles.discoverySection}>
      <View style={styles.sectionHeadingRow}>
        <Text style={[styles.sectionLabel, styles.discoveryTitle]}>{title}</Text>
        <AnimatedPressable onPress={onAction}>
          <Text style={styles.seeAll}>{actionLabel}</Text>
        </AnimatedPressable>
      </View>
      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryList}>
          {items.map((item) => (
            <AnimatedPressable key={item.key} onPress={() => onItemPress(item.key)} style={styles.discoveryCard}>
              <View style={[styles.discoveryArt, item.tone === 'peg' ? styles.pegBackground : styles.palaceBackground]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.discoveryImage} resizeMode="cover" />
                ) : item.tone === 'peg' ? (
                  <Text style={styles.discoveryEmoji}>{item.subtitle}</Text>
                ) : (
                  <MapPinned size={22} color={theme.violetDeep} />
                )}
              </View>
              <Text numberOfLines={1} style={styles.discoveryCardTitle}>{item.title}</Text>
              <Text style={styles.discoveryCardSubtitle}>{item.imageUrl ? item.subtitle : item.tone === 'peg' ? 'Anchor image' : item.subtitle}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.discoveryEmpty}><Text style={styles.emptyBody}>{emptyLabel ?? 'Nothing here yet'}</Text></View>
      )}
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
  discoverySection: { marginTop: 4 },
  discoveryTitle: { marginBottom: 0 },
  discoveryList: { gap: 10, paddingVertical: 10, paddingRight: 12 },
  discoveryCard: { width: 132, borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 8 },
  discoveryArt: { height: 76, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  discoveryEmoji: { fontSize: 31 },
  discoveryImage: { width: '100%', height: '100%', backgroundColor: '#BCAAF1' },
  discoveryCardTitle: { color: theme.ink, fontSize: 11.5, fontWeight: '900', marginTop: 7 },
  discoveryCardSubtitle: { color: theme.inkSoft, fontSize: 10.5, fontWeight: '700', marginTop: 2 },
  discoveryEmpty: { borderRadius: 16, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 14 },
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

const PEG_ANCHORS = [
  { number: 1, emoji: '🕯️', name: 'Candle' },
  { number: 2, emoji: '🦢', name: 'Swan' },
  { number: 3, emoji: '❤️', name: 'Heart' },
  { number: 4, emoji: '⛵', name: 'Sailboat' },
  { number: 5, emoji: '✋', name: 'Hand' },
  { number: 6, emoji: '🐘', name: 'Elephant' },
  { number: 7, emoji: '🌈', name: 'Rainbow' },
  { number: 8, emoji: '⛄', name: 'Snowman' },
  { number: 9, emoji: '🎈', name: 'Balloon' },
];
