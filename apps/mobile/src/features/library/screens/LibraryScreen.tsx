import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import LoadingView from '@/components/LoadingView';
import { useMemorySetMutations, useMemorySets } from '@/features/memory-sets';
import type { MemorySet, MemoryTechniqueKey } from '@/features/memory-sets';
import { MemorySetCard } from '@/components/MemorySetCard';
import { useDueMemoryReviews, useUpcomingMemoryReviews } from '@/features/practice-attempts';
import type { DueMemoryReview } from '@/features/practice-attempts';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { useUserState } from '@/contexts/UserStateContext';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Href, useRouter } from 'expo-router';
import { Plus, RefreshCcw, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { MemoryActionsSheet } from '../components/MemoryActionsSheet';

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
  const { userState } = useUserState();
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const upcomingReviews = useUpcomingMemoryReviews(30);
  const { duplicateMemorySet, setMemorySetArchived, deleteMemorySet } = useMemorySetMutations();
  const memoryActionsRef = useRef<BottomSheetModal>(null);
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMemorySet, setActionMemorySet] = useState<MemorySet>();
  const [deleteConfirmationMemory, setDeleteConfirmationMemory] = useState<MemorySet>();
  const pendingDeleteRef = useRef<MemorySet | undefined>(undefined);

  useEffect(() => {
    if (actionMemorySet) memoryActionsRef.current?.present();
  }, [actionMemorySet]);

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
  const reviewByMemorySetId = useMemo(() => {
    const nextReviewBySet = new Map<string, DueMemoryReview>();
    [...(dueReviews.data ?? []), ...(upcomingReviews.data ?? [])].forEach((review) => {
      const current = nextReviewBySet.get(review.memorySetId);
      if (!current || Date.parse(review.dueAt) < Date.parse(current.dueAt)) {
        nextReviewBySet.set(review.memorySetId, review);
      }
    });
    return nextReviewBySet;
  }, [dueReviews.data, upcomingReviews.data]);

  const showActions = (memorySet: MemorySet) => {
    setActionMessage(null);
    setActionMemorySet(memorySet);
  };

  const requestDeleteMemory = (memorySet: MemorySet) => {
    pendingDeleteRef.current = memorySet;
    memoryActionsRef.current?.dismiss();
  };

  const handleMemoryActionsDismiss = () => {
    setActionMemorySet(undefined);
    const pendingDelete = pendingDeleteRef.current;
    pendingDeleteRef.current = undefined;
    if (pendingDelete) setDeleteConfirmationMemory(pendingDelete);
  };

  const duplicateSelectedMemory = (memorySet: MemorySet) => {
    duplicateMemorySet.mutate(memorySet.id, {
      onSuccess: (copy) => {
        memoryActionsRef.current?.dismiss();
        setActionMessage(`“${copy.title}” ${t('readyInLibrary')}`);
      },
      onError: (error) => {
        memoryActionsRef.current?.dismiss();
        setActionMessage(getNumberPegErrorMessage(error, t('duplicateError')));
      },
    });
  };

  const toggleSelectedMemoryArchived = (memorySet: MemorySet) => {
    const isArchived = memorySet.status === 'archived';
    setMemorySetArchived.mutate(
      { memorySetId: memorySet.id, isArchived: !isArchived },
      {
        onSuccess: () => {
          memoryActionsRef.current?.dismiss();
          setActionMessage(isArchived ? t('memoryRestored') : t('memoryArchived'));
        },
        onError: (error) => {
          memoryActionsRef.current?.dismiss();
          setActionMessage(getNumberPegErrorMessage(error, t('updateError')));
        },
      },
    );
  };

  const deleteSelectedMemory = () => {
    if (!deleteConfirmationMemory) return;
    deleteMemorySet.mutate(deleteConfirmationMemory.id, {
      onSuccess: () => {
        setDeleteConfirmationMemory(undefined);
        setActionMessage(t('memoryDeleted'));
        void InAppNotificationSync.syncAllUpcoming(
          userState.notifications.reviewReminders,
          userState.preferences.language,
        );
      },
      onError: (error) => {
        setDeleteConfirmationMemory(undefined);
        setActionMessage(getNumberPegErrorMessage(error, t('deleteError')));
      },
    });
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
          <RefreshControl
            refreshing={memorySets.isRefetching || dueReviews.isRefetching || upcomingReviews.isRefetching}
            onRefresh={() => { void Promise.allSettled([memorySets.refetch(), dueReviews.refetch(), upcomingReviews.refetch()]); }}
          />
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
              {getNumberPegErrorMessage(memorySets.error, t('connectionRetry'))}
            </Text>
            <AnimatedPressable onPress={() => memorySets.refetch()} style={styles.retryButton}>
              <RefreshCcw size={16} color={theme.ink} />
              <Text style={styles.retryText}>{t('retry')}</Text>
            </AnimatedPressable>
          </View>
        ) : visibleSets.length ? (
          <View style={styles.cardList}>
            {visibleSets.map((memorySet) => (
              <MemorySetCard
                key={memorySet.id}
                memorySet={memorySet}
                reviewAt={reviewByMemorySetId.get(memorySet.id)?.dueAt}
                onOpen={() => openSet(router, memorySet)}
                onActions={() => showActions(memorySet)}
              />
            ))}
          </View>
        ) : filter === 'all' ? (
          <ModuleNoticeCard
            icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
            title={t('newMemory')}
            body={t('newMemoryBody')}
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

      <MemoryActionsSheet
        ref={memoryActionsRef}
        memorySet={actionMemorySet}
        isBusy={duplicateMemorySet.isPending || setMemorySetArchived.isPending || deleteMemorySet.isPending}
        onDismiss={handleMemoryActionsDismiss}
        onDuplicate={duplicateSelectedMemory}
        onToggleArchived={toggleSelectedMemoryArchived}
        onDelete={requestDeleteMemory}
      />
      <ConfirmModal
        visible={Boolean(deleteConfirmationMemory)}
        icon={<Trash2 size={28} color={theme.berryDeep} />}
        title={t('deleteTitle')}
        subject={deleteConfirmationMemory?.title}
        description={t('deleteDescription')}
        confirmText={t('delete')}
        cancelText={t('keepMemory')}
        destructive
        isLoading={deleteMemorySet.isPending}
        onConfirm={deleteSelectedMemory}
        onCancel={() => setDeleteConfirmationMemory(undefined)}
      />
    </View>
  );
}

function openSet(router: ReturnType<typeof useRouter>, memorySet: MemorySet) {
  router.push(`/memory-details/${memorySet.id}` as Href);
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
