import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import LoadingView from '@/components/LoadingView';
import { useInfiniteMemorySets, useMemorySetMutations } from '@/features/memory-sets';
import type { MemorySet, MemoryTechniqueKey } from '@/features/memory-sets';
import { MemorySetCard } from '@/components/MemorySetCard';
import { usePalaceScenes } from '@/features/palace-scenes';
import { useDueMemoryReviews, useUpcomingMemoryReviews } from '@/features/practice-attempts';
import type { DueMemoryReview } from '@/features/practice-attempts';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { useUserState } from '@/contexts/UserStateContext';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Href, useRouter } from 'expo-router';
import { Globe2, LayoutGrid, List as ListIcon, LockKeyhole, Plus, RefreshCcw, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';
import { MemoryActionsSheet } from '../components/MemoryActionsSheet';
import { DiscoverMemorySetsScreen } from './DiscoverMemorySetsScreen';

type LibraryFilter = 'all' | MemoryTechniqueKey | 'archived';
type LibraryViewMode = 'card' | 'list';
type LibraryTab = 'mine' | 'discover';

const filters: { key: LibraryFilter }[] = [
  { key: 'all' },
  { key: 'palace' },
  { key: 'number-peg' },
  { key: 'archived' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { t } = useTranslation('library');
  const { userState, updateState } = useUserState();
  const pagedMemorySets = useInfiniteMemorySets();
  const palaceScenes = usePalaceScenes();
  const dueReviews = useDueMemoryReviews();
  const upcomingReviews = useUpcomingMemoryReviews(30);
  const { duplicateMemorySet, setMemorySetArchived, setMemorySetVisibility, deleteMemorySet } = useMemorySetMutations();
  const memoryActionsRef = useRef<BottomSheetModal>(null);
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('mine');
  const [actionMemorySet, setActionMemorySet] = useState<MemorySet>();
  const [deleteConfirmationMemory, setDeleteConfirmationMemory] = useState<MemorySet>();
  const [visibilityConfirmationMemory, setVisibilityConfirmationMemory] = useState<MemorySet>();
  const pendingDeleteRef = useRef<MemorySet | undefined>(undefined);
  const pendingVisibilityRef = useRef<MemorySet | undefined>(undefined);
  const viewMode: LibraryViewMode = userState.ui.libraryViewMode ?? 'card';
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];

  useEffect(() => {
    if (actionMemorySet) memoryActionsRef.current?.present();
  }, [actionMemorySet]);

  const visibleSets = useMemo(() => {
    const items = pagedMemorySets.data?.pages.flatMap((page) => page.items) ?? [];
    return items
      .filter((memorySet) => {
        if (filter === 'archived') return memorySet.status === 'archived';
        if (memorySet.status === 'archived') return false;
        return filter === 'all' || memorySet.techniqueKey === filter;
      })
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }, [filter, pagedMemorySets.data]);

  const activeCount = pagedMemorySets.data?.pages.flatMap((page) => page.items).filter((memorySet) => memorySet.status !== 'archived').length ?? 0;
  const palaceSceneById = useMemo(
    () => new Map((palaceScenes.data ?? []).map((scene) => [scene.id, scene])),
    [palaceScenes.data],
  );
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
    setActionMemorySet(memorySet);
  };

  const changeViewMode = (mode: LibraryViewMode) => {
    if (mode === viewMode) return;
    void updateState({ ui: { ...userState.ui, libraryViewMode: mode } });
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
    const pendingVisibility = pendingVisibilityRef.current;
    pendingVisibilityRef.current = undefined;
    if (pendingVisibility) setVisibilityConfirmationMemory(pendingVisibility);
  };

  const duplicateSelectedMemory = (memorySet: MemorySet) => {
    duplicateMemorySet.mutate(memorySet.id, {
      onSuccess: (copy) => {
        memoryActionsRef.current?.dismiss();
        Toast.show({ type: 'success', text1: `“${copy.title}” ${t('readyInLibrary')}` });
      },
      onError: (error) => {
        memoryActionsRef.current?.dismiss();
        Toast.show({ type: 'error', text1: t('duplicateError'), text2: getNumberPegErrorMessage(error, t('duplicateError')) });
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
          Toast.show({ type: 'success', text1: isArchived ? t('memoryRestored') : t('memoryArchived') });
        },
        onError: (error) => {
          memoryActionsRef.current?.dismiss();
          Toast.show({ type: 'error', text1: t('updateError'), text2: getNumberPegErrorMessage(error, t('updateError')) });
        },
      },
    );
  };

  const deleteSelectedMemory = () => {
    if (!deleteConfirmationMemory) return;
    deleteMemorySet.mutate(deleteConfirmationMemory.id, {
      onSuccess: () => {
        setDeleteConfirmationMemory(undefined);
        Toast.show({ type: 'success', text1: t('memoryDeleted') });
        void InAppNotificationSync.syncAllUpcoming(
          userState.notifications.reviewReminders,
          userState.preferences.language,
        );
      },
      onError: (error) => {
        setDeleteConfirmationMemory(undefined);
        Toast.show({ type: 'error', text1: t('deleteError'), text2: getNumberPegErrorMessage(error, t('deleteError')) });
      },
    });
  };

  const requestVisibilityChange = (memorySet: MemorySet) => {
    pendingVisibilityRef.current = memorySet;
    memoryActionsRef.current?.dismiss();
  };

  const confirmVisibilityChange = (confirmPrivateAssets = false) => {
    if (!visibilityConfirmationMemory) return;
    const memorySet = visibilityConfirmationMemory;
    const visibility = memorySet.visibility === 'public' ? 'private' : 'public';
    setMemorySetVisibility.mutate({ memorySetId: memorySet.id, visibility, confirmPrivateAssets }, {
      onSuccess: () => {
        setVisibilityConfirmationMemory(undefined);
        Toast.show({ type: 'success', text1: visibility === 'public' ? t('memoryPublished') : t('memoryPrivate') });
      },
      onError: (error) => {
        setVisibilityConfirmationMemory(undefined);
        Toast.show({ type: 'error', text1: t('visibilityError'), text2: getNumberPegErrorMessage(error, t('visibilityError')) });
      },
    });
  };

  const visibilityIncludesPrivateAssets = visibilityConfirmationMemory
    ? hasPrivateAssets(visibilityConfirmationMemory, palaceSceneById)
    : false;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={[{ component: <AnimatedPressable accessibilityLabel={t('lessonLibrary')} onPress={() => router.push('/lessons' as Href)} style={styles.headerLessonButton}><Text style={styles.headerLessonEmoji}>📚</Text></AnimatedPressable> }]}
        hideBackButton
      />

      <View style={[styles.libraryTabBar, { backgroundColor: activeTheme.canvas, borderBottomColor: activeTheme.line }]}>
        <View style={[styles.libraryTabs, { backgroundColor: activeTheme.violetTint, borderColor: activeTheme.violetLine }]}>
          <AnimatedPressable
            accessibilityState={{ selected: libraryTab === 'mine' }}
            containerStyle={styles.libraryTabContainer}
            onPress={() => setLibraryTab('mine')}
            style={[styles.libraryTab, libraryTab === 'mine' && styles.libraryTabSelected, libraryTab === 'mine' ? { backgroundColor: activeTheme.violetDeep } : undefined]}>
            <Text style={styles.libraryTabEmoji}>📚</Text>
            <Text style={[styles.libraryTabText, { color: libraryTab === 'mine' ? '#FFFFFF' : activeTheme.inkSoft }]}>{t('myMemories')}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityState={{ selected: libraryTab === 'discover' }}
            containerStyle={styles.libraryTabContainer}
            onPress={() => setLibraryTab('discover')}
            style={[styles.libraryTab, libraryTab === 'discover' && styles.libraryTabSelected, libraryTab === 'discover' ? { backgroundColor: activeTheme.violetDeep } : undefined]}>
            <Text style={styles.libraryTabEmoji}>🧭</Text>
            <Text style={[styles.libraryTabText, { color: libraryTab === 'discover' ? '#FFFFFF' : activeTheme.inkSoft }]}>{t('discover')}</Text>
          </AnimatedPressable>
        </View>
      </View>

      {libraryTab === 'discover' ? <DiscoverMemorySetsScreen embedded /> : <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pagedMemorySets.isRefetching || dueReviews.isRefetching || upcomingReviews.isRefetching}
            onRefresh={() => { void Promise.allSettled([pagedMemorySets.refetch(), palaceScenes.refetch(), dueReviews.refetch(), upcomingReviews.refetch()]); }}
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

        <View style={styles.viewToolbar}>
          <Text style={styles.viewModeLabel}>{t('viewMode')}</Text>
          <View style={styles.viewActions}>
            <View style={styles.viewToggle}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('cardView')}
              accessibilityState={{ selected: viewMode === 'card' }}
              hitSlop={4}
              onPress={() => changeViewMode('card')}
              style={[styles.viewOption, viewMode === 'card' && styles.viewOptionSelected]}>
              <LayoutGrid size={16} color={viewMode === 'card' ? 'white' : theme.violetDeep} />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('listView')}
              accessibilityState={{ selected: viewMode === 'list' }}
              hitSlop={4}
              onPress={() => changeViewMode('list')}
              style={[styles.viewOption, viewMode === 'list' && styles.viewOptionSelected]}>
              <ListIcon size={16} color={viewMode === 'list' ? 'white' : theme.violetDeep} />
            </AnimatedPressable>
            </View>
          </View>
        </View>

        {pagedMemorySets.isLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description={t('loading')} />
          </View>
        ) : pagedMemorySets.isError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{t('unavailable')}</Text>
            <Text style={styles.noticeBody}>
              {getNumberPegErrorMessage(pagedMemorySets.error, t('connectionRetry'))}
            </Text>
            <AnimatedPressable onPress={() => pagedMemorySets.refetch()} style={styles.retryButton}>
              <RefreshCcw size={16} color={theme.ink} />
              <Text style={styles.retryText}>{t('retry')}</Text>
            </AnimatedPressable>
          </View>
        ) : visibleSets.length ? (
          <View style={[styles.cardList, viewMode === 'list' ? styles.listCardList : styles.cardGrid]}>
            {visibleSets.map((memorySet) => (
              <View key={memorySet.id} style={viewMode === 'card' ? styles.cardGridItem : undefined}>
                <MemorySetCard
                  memorySet={memorySet}
                  reviewAt={reviewByMemorySetId.get(memorySet.id)?.dueAt}
                  onOpen={() => openSet(router, memorySet)}
                  onActions={() => showActions(memorySet)}
                  variant={viewMode}
                  layout={viewMode === 'card' ? 'grid' : 'row'}
                  coverImageUrl={getPalaceScene(memorySet, palaceSceneById)?.imageUrl}
                  coverImageSource={getPalaceScene(memorySet, palaceSceneById)?.imageSource}
                />
              </View>
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
            <Text style={styles.emptyEmoji}>{filter === 'palace' ? '🏡' : filter === 'number-peg' ? '🦢' : '📦'}</Text>
            <Text style={styles.noticeTitle}>{filter === 'archived' ? t('archiveEmpty') : t('collectionEmpty')}</Text>
            <Text style={styles.noticeBody}>{filter === 'archived' ? t('archiveBody') : t('buildFirstBody')}</Text>
            {filter !== 'archived' && <AnimatedPressable onPress={() => router.push('/create-memory' as Href)} style={styles.emptyButton}><Plus size={17} color="white" /><Text style={styles.emptyButtonText}>{t('create')}</Text></AnimatedPressable>}
          </View>
        )}
        {pagedMemorySets.hasNextPage && !pagedMemorySets.isFetchingNextPage ? (
          <AnimatedPressable onPress={() => void pagedMemorySets.fetchNextPage()} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>{t('loadMore')}</Text>
          </AnimatedPressable>
        ) : pagedMemorySets.isFetchingNextPage ? <Text style={styles.loadMoreText}>{t('loading')}</Text> : null}
      </ScrollView>}

      <MemoryActionsSheet
        ref={memoryActionsRef}
        memorySet={actionMemorySet}
        isBusy={duplicateMemorySet.isPending || setMemorySetArchived.isPending || setMemorySetVisibility.isPending || deleteMemorySet.isPending}
        onDismiss={handleMemoryActionsDismiss}
        onDuplicate={duplicateSelectedMemory}
        onToggleArchived={toggleSelectedMemoryArchived}
        onDelete={requestDeleteMemory}
        onRequestVisibility={requestVisibilityChange}
      />
      <ConfirmModal
        visible={Boolean(visibilityConfirmationMemory)}
        icon={visibilityConfirmationMemory?.visibility === 'public' ? <LockKeyhole size={28} color={theme.inkSoft} /> : <Globe2 size={28} color={theme.grass} />}
        title={visibilityConfirmationMemory?.visibility === 'public' ? t('makePrivateTitle') : t('makePublicTitle')}
        subject={visibilityConfirmationMemory?.title}
        description={visibilityConfirmationMemory?.visibility === 'public'
          ? t('makePrivateDescription')
          : visibilityIncludesPrivateAssets
            ? t('privateAssetsDescription')
            : t('makePublicDescription')}
        confirmText={visibilityConfirmationMemory?.visibility === 'public'
          ? t('makePrivate')
          : visibilityIncludesPrivateAssets
            ? t('publishWithAssets')
            : t('makePublic')}
        cancelText={visibilityIncludesPrivateAssets ? t('keepPrivate') : t('cancel')}
        alternativeText={visibilityIncludesPrivateAssets ? t('reviewBeforePublishing') : undefined}
        isLoading={setMemorySetVisibility.isPending}
        onConfirm={() => confirmVisibilityChange(visibilityIncludesPrivateAssets)}
        onCancel={() => setVisibilityConfirmationMemory(undefined)}
        onAlternative={visibilityIncludesPrivateAssets && visibilityConfirmationMemory
          ? () => {
              const memorySetId = visibilityConfirmationMemory.id;
              setVisibilityConfirmationMemory(undefined);
              router.push(`/memory-details/${memorySetId}` as Href);
            }
          : undefined}
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

function getPalaceScene(
  memorySet: MemorySet,
  sceneById: Map<string, { imageUrl: string; imageSource?: number }>,
) {
  const sceneId = memorySet.techniquePlan?.palaceSceneId;
  return sceneId ? sceneById.get(sceneId) : undefined;
}

function hasPrivateAssets(
  memorySet: MemorySet,
  sceneById: Map<string, { isTemplate?: boolean }>,
) {
  if (memorySet.items.some((item) => Boolean(item.pronunciationAudioUrl))) return true;
  const plan = memorySet.techniquePlan;
  if (!plan) return false;
  if (plan.pegBindings.some((binding) => Boolean(binding.sceneAssetUrl))) return true;
  if (plan.palaceBindings.some((binding) => binding.isCustomScene || Boolean(binding.sceneAssetUrl))) return true;
  if (memorySet.techniqueKey !== 'palace' || !plan.palaceSceneId) return false;
  return sceneById.get(plan.palaceSceneId)?.isTemplate === false;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  libraryTabBar: {
    backgroundColor: theme.canvas,
    borderBottomColor: '#F0EDF8',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'relative',
    zIndex: 20,
  },
  libraryTabs: {
    backgroundColor: theme.violetTint,
    borderColor: theme.violetLine,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 4,
    padding: 3,
  },
  libraryTabContainer: { flex: 1 },
  libraryTab: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  libraryTabSelected: {
    backgroundColor: theme.violetDeep,
    boxShadow: '0px 3px 8px rgba(111, 86, 220, 0.22)',
  },
  libraryTabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  libraryTabEmoji: { fontSize: 16, lineHeight: 20 },
  libraryTabTextSelected: { color: 'white' },
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
  filterChipSelected: { borderColor: theme.violetDeep, backgroundColor: theme.violetDeep },
  filterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  filterTextSelected: { color: 'white' },
  viewToolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  viewActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headerLessonButton: { alignItems: 'center', backgroundColor: '#F2EEFF', borderColor: '#DDD3FF', borderRadius: 19, borderWidth: 1.5, height: 40, justifyContent: 'center', width: 40 },
  headerLessonEmoji: { fontSize: 20 },
  viewModeLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  viewToggle: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', padding: 3 },
  viewOption: { alignItems: 'center', borderRadius: 9, height: 34, justifyContent: 'center', width: 36 },
  viewOptionSelected: { backgroundColor: theme.violetDeep },
  cardList: { gap: 10 },
  listCardList: { gap: 6 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  cardGridItem: { width: '48.5%' },
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
    backgroundColor: theme.violetDeep,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emptyButtonText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 13 },
  loadMoreButton: { alignSelf: 'center', marginTop: 16, borderRadius: 999, backgroundColor: theme.skyTint, paddingHorizontal: 18, paddingVertical: 10 },
  loadMoreText: { textAlign: 'center', color: theme.sky, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  lessonEntry: { alignItems: 'center', backgroundColor: theme.sunTint, borderColor: theme.sunLine, borderRadius: 999, borderWidth: 1.5, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  lessonEntryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 10 }, lessonEntryArrow: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  loadingFrame: { height: 180, overflow: 'hidden', borderRadius: 20 },
});
