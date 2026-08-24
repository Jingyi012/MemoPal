import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet, MemoryTechniqueKey } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { Brain, ChevronRight, MapPinned, Plus, RefreshCcw, Shapes } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

type LibraryFilter = 'all' | MemoryTechniqueKey;

const filters: { key: LibraryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'palace', label: 'Palaces' },
  { key: 'number-peg', label: 'Number Peg' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const memorySets = useMemorySets();
  const [filter, setFilter] = useState<LibraryFilter>('all');

  const visibleSets = useMemo(() => {
    const items = memorySets.data ?? [];
    return items
      .filter((memorySet) => filter === 'all' || memorySet.techniqueKey === filter)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }, [filter, memorySets.data]);

  return (
    <View style={styles.page}>
      <CommonHeader
        title="Library"
        description="Every memory you build, ready when you need it"
        hideBackButton
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={memorySets.isRefetching} onRefresh={memorySets.refetch} />
        }>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Brain size={25} color="#36304D" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryEyebrow}>YOUR MEMORY COLLECTION</Text>
            <Text style={styles.summaryTitle}>
              {memorySets.data?.length ?? 0}{' '}
              {(memorySets.data?.length ?? 0) === 1 ? 'memory' : 'memories'}
            </Text>
            <Text style={styles.summaryBody}>Small practice sessions make these paths stronger.</Text>
          </View>
          <AnimatedPressable
            accessibilityLabel="Create a memory"
            onPress={() => router.push('/(tabs)/practice' as Href)}
            style={styles.addButton}>
            <Plus size={21} color="#36304D" />
          </AnimatedPressable>
        </View>

        <View style={styles.filterRow}>
          {filters.map((item) => {
            const selected = item.key === filter;
            return (
              <AnimatedPressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, selected && styles.filterChipSelected]}>
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {item.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {memorySets.isLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description="Opening your Library…" />
          </View>
        ) : memorySets.isError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Your Library is out of reach</Text>
            <Text style={styles.noticeBody}>
              {getNumberPegErrorMessage(memorySets.error, 'Check your connection and try again.')}
            </Text>
            <AnimatedPressable onPress={() => memorySets.refetch()} style={styles.retryButton}>
              <RefreshCcw size={16} color={theme.ink} />
              <Text style={styles.retryText}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : visibleSets.length ? (
          <View style={styles.cardList}>
            {visibleSets.map((memorySet) => (
              <MemoryCard key={memorySet.id} memorySet={memorySet} onOpen={() => openSet(router, memorySet)} />
            ))}
          </View>
        ) : (
          <View style={styles.noticeCard}>
            <Text style={styles.emptyEmoji}>{filter === 'palace' ? '🏡' : filter === 'number-peg' ? '🦢' : '✨'}</Text>
            <Text style={styles.noticeTitle}>
              {filter === 'all' ? 'Build your first memory' : 'Nothing in this collection yet'}
            </Text>
            <Text style={styles.noticeBody}>
              Choose a technique in Practice and turn something useful into a playful memory.
            </Text>
            <AnimatedPressable
              onPress={() => router.push('/(tabs)/practice' as Href)}
              style={styles.emptyButton}>
              <Plus size={17} color="white" />
              <Text style={styles.emptyButtonText}>Create memory</Text>
            </AnimatedPressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function openSet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(
    (memorySet.techniqueKey === 'palace'
      ? `/palaces/memory/${memorySet.id}`
      : `/number-peg/${memorySet.id}`) as Href
  );
}

function MemoryCard({
  memorySet,
  onOpen,
}: {
  memorySet: MemorySet;
  onOpen: () => void;
}) {
  const isPalace = memorySet.techniqueKey === 'palace';
  const updatedLabel = formatUpdatedAt(memorySet.updatedAt);

  return (
    <AnimatedPressable onPress={onOpen} style={styles.memoryCard}>
      <View style={[styles.techniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
        {isPalace ? (
          <MapPinned size={23} color="#247B67" />
        ) : (
          <Shapes size={23} color={theme.berryDeep} />
        )}
      </View>
      <View style={styles.memoryCopy}>
        <View style={styles.techniqueRow}>
          <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
            {isPalace ? 'MEMORY PALACE' : 'NUMBER PEG'}
          </Text>
          <Text style={styles.updatedLabel}>{updatedLabel}</Text>
        </View>
        <Text numberOfLines={1} style={styles.memoryTitle}>
          {memorySet.title}
        </Text>
        <Text style={styles.memoryMeta}>
          {memorySet.items.length} {memorySet.items.length === 1 ? 'item' : 'items'} ·{' '}
          {memorySet.status === 'draft' ? 'Draft' : 'Ready to practice'}
        </Text>
      </View>
      <ChevronRight size={20} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

function formatUpdatedAt(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';

  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    borderRadius: 24,
    backgroundColor: '#36304D',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: { flex: 1, marginHorizontal: 13 },
  summaryEyebrow: { color: '#C9C5E0', fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  summaryTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 3 },
  summaryBody: { color: '#DAD6E8', fontSize: 11, lineHeight: 16, marginTop: 3 },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  filterChip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: { borderColor: '#36304D', backgroundColor: '#36304D' },
  filterText: { color: theme.inkSoft, fontSize: 12, fontWeight: '800' },
  filterTextSelected: { color: 'white' },
  cardList: { gap: 10 },
  memoryCard: {
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  techniqueIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  palaceIcon: { backgroundColor: '#E3F6ED' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  memoryCopy: { flex: 1, marginHorizontal: 12 },
  techniqueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  techniqueLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  palaceLabel: { color: '#247B67' },
  pegLabel: { color: theme.berryDeep },
  updatedLabel: { color: '#9A97A7', fontSize: 10, fontWeight: '700' },
  memoryTitle: { color: theme.ink, fontSize: 15, fontWeight: '900', marginTop: 4 },
  memoryMeta: { color: theme.inkSoft, fontSize: 11, fontWeight: '700', marginTop: 3 },
  noticeCard: {
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  noticeTitle: { color: theme.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  noticeBody: { color: theme.inkSoft, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.sun,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  retryText: { color: theme.ink, fontSize: 13, fontWeight: '900' },
  emptyEmoji: { fontSize: 32, marginBottom: 9 },
  emptyButton: {
    marginTop: 15,
    borderRadius: 13,
    backgroundColor: '#36304D',
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emptyButtonText: { color: 'white', fontSize: 13, fontWeight: '900' },
  loadingFrame: { height: 180, overflow: 'hidden', borderRadius: 20 },
});
