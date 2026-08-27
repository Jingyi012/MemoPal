import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import LoadingView from '@/components/LoadingView';
import { useMemorySetMutations, useMemorySets } from '@/features/memory-sets';
import type { MemorySet, MemoryTechniqueKey } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { Archive, ChevronRight, MoreHorizontal, Plus, RefreshCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

type LibraryFilter = 'all' | MemoryTechniqueKey | 'archived';

const filters: { key: LibraryFilter }[] = [
  { key: 'all' },
  { key: 'palace' },
  { key: 'number-peg' },
  { key: 'archived' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation('library');
  const memorySets = useMemorySets();
  const { duplicateMemorySet, setMemorySetArchived } = useMemorySetMutations();
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const visibleSets = useMemo(() => {
    const items = memorySets.data ?? [];
    return items
      .filter((memorySet) => {
        if (filter === 'archived') return memorySet.status === 'archived';
        if (memorySet.status === 'archived') return false;
        return filter === 'all' || memorySet.techniqueKey === filter;
      })
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }, [filter, memorySets.data]);

  const activeCount = memorySets.data?.filter((memorySet) => memorySet.status !== 'archived').length ?? 0;

  const showActions = (memorySet: MemorySet) => {
    const isArchived = memorySet.status === 'archived';
    Alert.alert(memorySet.title, 'Keep your Library tidy or make a copy to reuse this memory.', [
      {
        text: 'Duplicate',
        onPress: () => duplicateMemorySet.mutate(memorySet.id, {
          onSuccess: (copy) => setActionMessage(`“${copy.title}” is ready in your Library.`),
          onError: (error) => setActionMessage(getNumberPegErrorMessage(error, 'Could not duplicate this memory.')),
        }),
      },
      {
        text: isArchived ? 'Restore' : 'Archive',
        onPress: () => setMemorySetArchived.mutate(
          { memorySetId: memorySet.id, isArchived: !isArchived },
          {
            onSuccess: () => setActionMessage(isArchived ? 'Memory restored.' : 'Memory moved to Archived.'),
            onError: (error) => setActionMessage(getNumberPegErrorMessage(error, 'Could not update this memory.')),
          }
        ),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        hideBackButton
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={memorySets.isRefetching} onRefresh={memorySets.refetch} />
        }>
        <NightEmphasisCard style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryEmoji}>🧠</Text>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryEyebrow}>{t('collection')}</Text>
            <Text style={styles.summaryTitle}>
              {activeCount}{' '}
              {activeCount === 1 ? t('memory') : t('memories')}
            </Text>
            <Text style={styles.summaryBody}>{t('collectionBody')}</Text>
          </View>
          <AnimatedPressable
            accessibilityLabel={t('create')}
            onPress={() => router.push('/create-memory' as Href)}
            style={styles.addButton}>
            <Plus size={21} color={theme.ink} />
          </AnimatedPressable>
        </NightEmphasisCard>

        <View style={styles.filterRow}>
          {filters.map((item) => {
            const selected = item.key === filter;
            return (
              <AnimatedPressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, selected && styles.filterChipSelected]}>
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {item.key === 'all' ? t('all') : item.key === 'palace' ? t('palaces') : item.key === 'number-peg' ? t('numberPeg') : t('archived')}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {actionMessage && (
          <AnimatedPressable onPress={() => setActionMessage(null)} style={styles.actionNotice}>
            <Text style={styles.actionNoticeText}>{actionMessage}</Text>
          </AnimatedPressable>
        )}

        {memorySets.isLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description={t('loading')} />
          </View>
        ) : memorySets.isError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{t('unavailable')}</Text>
            <Text style={styles.noticeBody}>
              {getNumberPegErrorMessage(memorySets.error, 'Check your connection and try again.')}
            </Text>
            <AnimatedPressable onPress={() => memorySets.refetch()} style={styles.retryButton}>
              <RefreshCcw size={16} color={theme.ink} />
              <Text style={styles.retryText}>{t('retry')}</Text>
            </AnimatedPressable>
          </View>
        ) : visibleSets.length ? (
          <View style={styles.cardList}>
            {visibleSets.map((memorySet) => (
              <MemoryCard
                key={memorySet.id}
                memorySet={memorySet}
                onOpen={() => openSet(router, memorySet)}
                onActions={() => showActions(memorySet)}
              />
            ))}
          </View>
        ) : filter === 'all' ? (
          <ModuleNoticeCard
            icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
            title={t('newSession')}
            body={t('newSessionBody')}
            actionLabel={t('tapToStart')}
            actionIcon={<Plus size={15} color={theme.ink} />}
            onAction={() => router.push('/create-memory' as Href)}
          />
        ) : (
          <View style={styles.noticeCard}>
            <Text style={styles.emptyEmoji}>{filter === 'palace' ? '🏡' : filter === 'number-peg' ? '🦢' : filter === 'archived' ? '📦' : '✨'}</Text>
            <Text style={styles.noticeTitle}>
              {filter === 'archived' ? t('archiveEmpty') : t('collectionEmpty')}
            </Text>
            <Text style={styles.noticeBody}>
              {filter === 'archived'
                ? t('archiveBody')
                : t('buildFirstBody')}
            </Text>
            {filter !== 'archived' && (
              <AnimatedPressable
                onPress={() => router.push('/create-memory' as Href)}
                style={styles.emptyButton}>
                <Plus size={17} color="white" />
                <Text style={styles.emptyButtonText}>{t('create')}</Text>
              </AnimatedPressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function openSet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
}

function MemoryCard({
  memorySet,
  onOpen,
  onActions,
}: {
  memorySet: MemorySet;
  onOpen: () => void;
  onActions: () => void;
}) {
  const isPalace = memorySet.techniqueKey === 'palace';
  const updatedLabel = formatUpdatedAt(memorySet.updatedAt);

  return (
    <AnimatedPressable onPress={onOpen} style={styles.memoryCard}>
      <View style={[styles.techniqueIcon, isPalace ? styles.palaceIcon : styles.pegIcon]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
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
          {memorySet.status === 'archived'
            ? 'Archived'
            : memorySet.status === 'draft'
              ? 'Draft'
              : 'Ready to practice'}
        </Text>
      </View>
      <AnimatedPressable
        accessibilityLabel={`More actions for ${memorySet.title}`}
        onPress={(event) => {
          event.stopPropagation();
          onActions();
        }}
        style={styles.moreButton}>
        {memorySet.status === 'archived'
          ? <Archive size={18} color={theme.inkSoft} />
          : <MoreHorizontal size={20} color={theme.inkSoft} />}
      </AnimatedPressable>
      <ChevronRight size={18} color={theme.inkSoft} />
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
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryEmoji: { fontSize: 24 },
  summaryCopy: { flex: 1, marginHorizontal: 13 },
  summaryEyebrow: { color: '#C9C5E0', fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.9 },
  summaryTitle: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 20, marginTop: 3 },
  summaryBody: { color: '#DAD6E8', fontSize: 11, lineHeight: 16, marginTop: 3 },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.sun,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 18 },
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
  filterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  filterTextSelected: { color: 'white' },
  actionNotice: { marginBottom: 14, borderRadius: 14, backgroundColor: '#F1FBF5', borderWidth: 1.5, borderColor: '#BFE7D6', paddingHorizontal: 13, paddingVertical: 11 },
  actionNoticeText: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
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
  techniqueEmoji: { fontSize: 22 },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  pegIcon: { backgroundColor: '#FFF0F4' },
  memoryCopy: { flex: 1, marginHorizontal: 12 },
  techniqueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  updatedLabel: { color: '#9A97A7', fontFamily: typography.bodyBold, fontSize: 10 },
  memoryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, marginTop: 4 },
  memoryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, marginTop: 3 },
  moreButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticeCard: {
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  noticeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, textAlign: 'center' },
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
  retryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  emptyIconEmoji: { fontSize: 24 },
  emptyEmoji: { fontSize: 32, marginBottom: 9 },
  emptyButton: {
    marginTop: 15,
    borderRadius: 13,
    backgroundColor: theme.ink,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emptyButtonText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 13 },
  loadingFrame: { height: 180, overflow: 'hidden', borderRadius: 20 },
});
