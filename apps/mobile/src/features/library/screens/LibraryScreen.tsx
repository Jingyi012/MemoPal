import { useAuth } from '@/contexts/AuthProvider';
import { SpotlightTarget, usePageTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import LoadingView from '@/components/LoadingView';
import { useInfiniteMemorySets, useMemorySetMutations } from '@/features/memory-sets';
import { useMemoryFolderMutations, useMemoryFolders } from '../hooks/useMemoryFolders';
import type { MemoryFolder, MemoryFolderCreateRequest } from '../types/memoryFolder.types';
import type { MemorySet, MemoryTechniqueKey } from '@/features/memory-sets';
import { MemorySetCard } from '@/components/MemorySetCard';
import { usePalaceScenes } from '@/features/palace-scenes';
import { useDueMemoryReviews, useUpcomingMemoryReviews } from '@/features/practice-attempts';
import type { DueMemoryReview } from '@/features/practice-attempts';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { useUserState } from '@/contexts/UserStateContext';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Href, useRouter } from 'expo-router';
import { CircleHelp, Globe2, Layers, LayoutGrid, List as ListIcon, LockKeyhole, Plus, RefreshCcw, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MemoryActionsSheet } from '../components/MemoryActionsSheet';
import { DiscoverMemorySetsScreen } from './DiscoverMemorySetsScreen';
import { MemoryFolderCard } from '../components/MemoryFolderCard';
import { MemoryFolderActionsSheet } from '../components/MemoryFolderActionsSheet';
import { FolderNameModal } from '../components/FolderNameModal';
import { MemoryMoveModal } from '../components/MemoryMoveModal';

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
  const { styles, theme } = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const [replayRequested, setReplayRequested] = useState(false);
  const { user: authUser } = useAuth();
  const { t: tourT } = useTranslation('onboarding');
  const revealTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const createMemory = () => router.push('/create-memory' as Href);
  const { t } = useTranslation('library');
  const { userState, updateState } = useUserState();
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const pagedMemorySets = useInfiniteMemorySets(filter === 'archived' ? undefined : { unfiled: true });
  const foldersQuery = useMemoryFolders();
  const palaceScenes = usePalaceScenes();
  const dueReviews = useDueMemoryReviews();
  const upcomingReviews = useUpcomingMemoryReviews(30);
  const { duplicateMemorySet, setMemorySetArchived, setMemorySetVisibility, deleteMemorySet, moveMemorySet } = useMemorySetMutations();
  const { createFolder, renameFolder, deleteFolder } = useMemoryFolderMutations();
  const memoryActionsRef = useRef<BottomSheetModal>(null);
  const collectionActionsRef = useRef<BottomSheetModal>(null);
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('mine');
  const replayTour = usePageTour('libraryPage', authUser?.onboardingStatus === 'not-started', libraryTab === 'mine');
  useEffect(() => {
    if (libraryTab !== 'mine' || !replayRequested) return;
    setReplayRequested(false);
    replayTour();
  }, [libraryTab, replayRequested, replayTour]);
  const [actionMemorySet, setActionMemorySet] = useState<MemorySet>();
  const [actionCollection, setActionCollection] = useState<MemoryFolder>();
  const [deleteConfirmationMemory, setDeleteConfirmationMemory] = useState<MemorySet>();
  const [visibilityConfirmationMemory, setVisibilityConfirmationMemory] = useState<MemorySet>();
  const [moveMemory, setMoveMemory] = useState<MemorySet>();
  const [folderNameModal, setFolderNameModal] = useState<{ folder?: MemoryFolder } | null>(null);
  const [deleteFolderConfirmation, setDeleteFolderConfirmation] = useState<MemoryFolder>();
  const pendingDeleteRef = useRef<MemorySet | undefined>(undefined);
  const pendingVisibilityRef = useRef<MemorySet | undefined>(undefined);
  const pendingMovePickerRef = useRef<MemorySet | undefined>(undefined);
  const pendingMoveMemoryRef = useRef<MemorySet | undefined>(undefined);
  const pendingCollectionActionRef = useRef<(() => void) | undefined>(undefined);
  const viewMode: LibraryViewMode = userState.ui.libraryViewMode ?? 'card';
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();

  useEffect(() => {
    if (actionMemorySet) memoryActionsRef.current?.present();
  }, [actionMemorySet]);

  useEffect(() => {
    if (actionCollection) collectionActionsRef.current?.present();
  }, [actionCollection]);

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

  const folders = foldersQuery.data ?? [];
  const showFolders = filter !== 'archived';
  const hasExplorerEntries = (showFolders && folders.length > 0) || visibleSets.length > 0;
  const explorerEntries = [
    ...(showFolders ? folders.map((folder, index) => ({ kind: 'folder' as const, folder, index })) : []),
    ...visibleSets.map((memorySet) => ({ kind: 'memorySet' as const, memorySet })),
  ];
  const cardColumns = [
    explorerEntries.filter((_, index) => index % 2 === 0),
    explorerEntries.filter((_, index) => index % 2 === 1),
  ];
  const explorerHasError = canShowRequestErrors && (foldersQuery.isError || pagedMemorySets.isError);
  const explorerIsLoading = !hasExplorerEntries && !isOffline &&
    (foldersQuery.isLoading || pagedMemorySets.isLoading);
  const memoryCount = filter === 'archived'
    ? pagedMemorySets.data?.pages[0]?.totalCount ?? 0
    : (pagedMemorySets.data?.pages[0]?.totalCount ?? 0) + folders.reduce((total, folder) => total + folder.memorySetCount, 0);
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

  const renderFolderCard = (folder: MemoryFolder, index: number, variant: LibraryViewMode) => (
    <MemoryFolderCard
      key={`folder-${folder.id}`}
      folder={folder}
      variant={variant}
      tone={index}
      onOpen={() => router.push(`/memory-folders/${folder.id}` as Href)}
      onLongPress={() => showCollectionActions(folder)}
    />
  );

  const renderMemorySetCard = (memorySet: MemorySet, variant: LibraryViewMode) => (
    <MemorySetCard
      key={memorySet.id}
      memorySet={memorySet}
      reviewAt={reviewByMemorySetId.get(memorySet.id)?.dueAt}
      onOpen={() => openSet(router, memorySet)}
      onActions={() => showActions(memorySet)}
      variant={variant}
      layout={variant === 'card' ? 'grid' : 'row'}
      coverImageUrl={getPalaceScene(memorySet, palaceSceneById)?.imageUrl}
      coverImageSource={getPalaceScene(memorySet, palaceSceneById)?.imageSource}
    />
  );

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
    const pendingMove = pendingMovePickerRef.current;
    pendingMovePickerRef.current = undefined;
    if (pendingMove) setMoveMemory(pendingMove);
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

  const createOrRenameFolder = (collection: MemoryFolderCreateRequest) => {
    const current = folderNameModal?.folder;
    const onSuccess = (created?: MemoryFolder) => {
      setFolderNameModal(null);
      const pendingMemory = pendingMoveMemoryRef.current;
      pendingMoveMemoryRef.current = undefined;
      if (!current && created && pendingMemory) {
        moveMemorySet.mutate({ memorySetId: pendingMemory.id, folderId: created.id }, { onSuccess: () => Toast.show({ type: 'success', text1: t('memoryMoved') }), onError: () => Toast.show({ type: 'error', text1: t('moveError') }) });
      } else Toast.show({ type: 'success', text1: current ? t('folderRenamed') : t('folderCreated') });
    };
    const onError = () => Toast.show({ type: 'error', text1: t('folderError') });
    if (current) renameFolder.mutate({ folderId: current.id, request: collection }, { onSuccess, onError });
    else createFolder.mutate(collection, { onSuccess, onError });
  };

  const showCollectionActions = (collection: MemoryFolder) => {
    setActionCollection(collection);
  };

  const runCollectionActionAfterDismiss = (action: () => void) => {
    pendingCollectionActionRef.current = action;
    collectionActionsRef.current?.dismiss();
  };

  const handleCollectionActionsDismiss = () => {
    setActionCollection(undefined);
    const action = pendingCollectionActionRef.current;
    pendingCollectionActionRef.current = undefined;
    action?.();
  };

  const deleteSelectedFolder = () => {
    const folder = deleteFolderConfirmation;
    if (!folder) return;
    deleteFolder.mutate(folder.id, { onSuccess: () => { setDeleteFolderConfirmation(undefined); Toast.show({ type: 'success', text1: t('folderDeleted') }); }, onError: () => { setDeleteFolderConfirmation(undefined); Toast.show({ type: 'error', text1: t('folderError') }); } });
  };

  const requestMoveMemory = (memorySet: MemorySet) => {
    pendingMovePickerRef.current = memorySet;
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
        actions={[{ icon: CircleHelp, onPress: () => { setLibraryTab('mine'); setReplayRequested(true); }, accessibilityLabel: tourT('guideEntry') }]}
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
            <Text style={[styles.libraryTabText, { color: libraryTab === 'mine' ? activeTheme.onAccent : activeTheme.inkSoft }]}>{t('myMemories')}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityState={{ selected: libraryTab === 'discover' }}
            containerStyle={styles.libraryTabContainer}
            onPress={() => setLibraryTab('discover')}
            style={[styles.libraryTab, libraryTab === 'discover' && styles.libraryTabSelected, libraryTab === 'discover' ? { backgroundColor: activeTheme.violetDeep } : undefined]}>
            <Text style={styles.libraryTabEmoji}>🧭</Text>
            <Text style={[styles.libraryTabText, { color: libraryTab === 'discover' ? activeTheme.onAccent : activeTheme.inkSoft }]}>{t('discover')}</Text>
          </AnimatedPressable>
        </View>
      </View>

      {libraryTab === 'discover' ? <DiscoverMemorySetsScreen embedded /> : <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pagedMemorySets.isRefetching || foldersQuery.isRefetching || dueReviews.isRefetching || upcomingReviews.isRefetching}
            onRefresh={() => { void Promise.allSettled([pagedMemorySets.refetch(), foldersQuery.refetch(), palaceScenes.refetch(), dueReviews.refetch(), upcomingReviews.refetch()]); }}
          />
        }>
        <NightEmphasisCard style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryEmoji}>🧠</Text>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryEyebrow}>{t('collection')}</Text>
            <Text style={styles.summaryTitle}>
              {memoryCount}{' '}
              {memoryCount === 1 ? t('memory') : t('memories')}
            </Text>
            <Text style={styles.summaryBody}>{t('collectionBody')}</Text>
          </View>
          <SpotlightTarget id="libraryStarter" onReveal={revealTop} onActivate={createMemory}>
            <AnimatedPressable accessibilityLabel={t('create')} onPress={createMemory} style={styles.addButton}>
              <Plus size={21} color={theme.onSun} />
            </AnimatedPressable>
          </SpotlightTarget>
        </NightEmphasisCard>

        <SpotlightTarget id="libraryFilter" onReveal={revealTop}>
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

        </SpotlightTarget>
        <View style={styles.viewToolbar}>
          <AnimatedPressable accessibilityLabel={t('newFolder')} onPress={() => setFolderNameModal({})} style={styles.newFolderButton}>
            <Layers size={17} color={theme.onAccent} />
            <Text style={styles.newFolderText}>{t('newFolder')}</Text>
          </AnimatedPressable>
          <View accessibilityLabel={t('viewMode')} style={styles.viewToggle}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('cardView')}
              accessibilityState={{ selected: viewMode === 'card' }}
              hitSlop={4}
              onPress={() => changeViewMode('card')}
              style={[styles.viewOption, viewMode === 'card' && styles.viewOptionSelected]}>
              <LayoutGrid size={16} color={viewMode === 'card' ? theme.onAccent : theme.violetDeep} />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('listView')}
              accessibilityState={{ selected: viewMode === 'list' }}
              hitSlop={4}
              onPress={() => changeViewMode('list')}
              style={[styles.viewOption, viewMode === 'list' && styles.viewOptionSelected]}>
              <ListIcon size={16} color={viewMode === 'list' ? theme.onAccent : theme.violetDeep} />
            </AnimatedPressable>
          </View>
        </View>

        {explorerHasError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{t('unavailable')}</Text>
            <Text style={styles.noticeBody}>{t('connectionRetry')}</Text>
            <AnimatedPressable onPress={() => { void Promise.allSettled([foldersQuery.refetch(), pagedMemorySets.refetch()]); }} style={styles.retryButton}>
              <RefreshCcw size={16} color={theme.onSun} />
              <Text style={styles.retryText}>{t('retry')}</Text>
            </AnimatedPressable>
          </View>
        ) : null}

        {explorerIsLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description={t('loading')} />
          </View>
        ) : hasExplorerEntries ? (
          viewMode === 'card' ? (
            <View style={styles.cardGrid}>
              {cardColumns.map((column, columnIndex) => (
                <View key={columnIndex} style={styles.cardGridColumn}>
                  {column.map((entry) => entry.kind === 'folder'
                    ? renderFolderCard(entry.folder, entry.index, 'card')
                    : renderMemorySetCard(entry.memorySet, 'card'))}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.cardList, styles.listCardList]}>
              {showFolders ? folders.map((folder, index) => renderFolderCard(folder, index, 'list')) : null}
              {visibleSets.map((memorySet) => renderMemorySetCard(memorySet, 'list'))}
            </View>
          )
        ) : !isOffline && !explorerHasError && filter === 'all' ? (
          <ModuleNoticeCard
            icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
            title={t('newMemory')}
            body={t('newMemoryBody')}
            actionLabel={t('tapToStart')}
            actionIcon={<Plus size={15} color={theme.onSun} />}
            onAction={createMemory}
          />
        ) : !isOffline && !explorerHasError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.emptyEmoji}>{filter === 'palace' ? '🏡' : filter === 'number-peg' ? '🦢' : '📦'}</Text>
            <Text style={styles.noticeTitle}>{filter === 'archived' ? t('archiveEmpty') : t('collectionEmpty')}</Text>
            <Text style={styles.noticeBody}>{filter === 'archived' ? t('archiveBody') : t('buildFirstBody')}</Text>
            {filter !== 'archived' && <AnimatedPressable onPress={createMemory} style={styles.emptyButton}><Plus size={17} color={theme.onAccent} /><Text style={styles.emptyButtonText}>{t('create')}</Text></AnimatedPressable>}
          </View>
        ) : null}
        {!isOffline && pagedMemorySets.hasNextPage && !pagedMemorySets.isFetchingNextPage ? (
          <AnimatedPressable onPress={() => void pagedMemorySets.fetchNextPage()} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>{t('loadMore')}</Text>
          </AnimatedPressable>
        ) : pagedMemorySets.isFetchingNextPage ? <Text style={styles.loadMoreText}>{t('loading')}</Text> : null}
      </ScrollView>}
      {libraryTab === 'mine' ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel={t('create')}
          accessibilityHint={t('newMemoryBody')}
          onPress={createMemory}
          style={[styles.createFab, { bottom: Math.max(16, insets.bottom + 10), backgroundColor: activeTheme.sun }]}>
          <Plus size={26} color={activeTheme.onSun} strokeWidth={2.8} />
        </AnimatedPressable>
      ) : null}

      <MemoryActionsSheet
        ref={memoryActionsRef}
        memorySet={actionMemorySet}
        isBusy={duplicateMemorySet.isPending || setMemorySetArchived.isPending || setMemorySetVisibility.isPending || deleteMemorySet.isPending}
        onDismiss={handleMemoryActionsDismiss}
        onDuplicate={duplicateSelectedMemory}
        onToggleArchived={toggleSelectedMemoryArchived}
        onDelete={requestDeleteMemory}
        onRequestVisibility={requestVisibilityChange}
        onMove={requestMoveMemory}
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
      <MemoryFolderActionsSheet
        ref={collectionActionsRef}
        collection={actionCollection}
        onDismiss={handleCollectionActionsDismiss}
        onRename={(collection) => runCollectionActionAfterDismiss(() => setFolderNameModal({ folder: collection }))}
        onDelete={(collection) => runCollectionActionAfterDismiss(() => setDeleteFolderConfirmation(collection))}
      />
      <ConfirmModal
        visible={Boolean(deleteFolderConfirmation)}
        icon={<Trash2 size={28} color={theme.berryDeep} />}
        title={t('deleteFolderTitle')}
        subject={deleteFolderConfirmation?.name}
        description={t('deleteFolderDescription')}
        confirmText={t('deleteFolder')}
        cancelText={t('cancel')}
        destructive
        isLoading={deleteFolder.isPending}
        onConfirm={deleteSelectedFolder}
        onCancel={() => setDeleteFolderConfirmation(undefined)}
      />
      <FolderNameModal visible={Boolean(folderNameModal)} initialName={folderNameModal?.folder?.name} initialEmoji={folderNameModal?.folder?.emoji} initialDescription={folderNameModal?.folder?.description} isLoading={createFolder.isPending || renameFolder.isPending} onCancel={() => { pendingMoveMemoryRef.current = undefined; setFolderNameModal(null); }} onSubmit={createOrRenameFolder} />
      <MemoryMoveModal
        memorySet={moveMemory}
        folders={folders}
        isLoading={moveMemorySet.isPending}
        onCancel={() => setMoveMemory(undefined)}
        onCreateFolder={() => {
          pendingMoveMemoryRef.current = moveMemory;
          setMoveMemory(undefined);
          setFolderNameModal({});
        }}
        onSelect={(folderId) => {
          const memorySet = moveMemory;
          if (!memorySet) return;
          setMoveMemory(undefined);
          moveMemorySet.mutate({ memorySetId: memorySet.id, folderId }, { onSuccess: () => Toast.show({ type: 'success', text1: t('memoryMoved') }), onError: () => Toast.show({ type: 'error', text1: t('moveError') }) });
        }}
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  libraryTabBar: {
    backgroundColor: theme.canvas,
    borderBottomColor: theme.line,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
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
    minHeight: 48,
    paddingHorizontal: 12,
  },
  libraryTabSelected: {
    backgroundColor: theme.violetDeep,
    boxShadow: '0px 3px 8px rgba(111, 86, 220, 0.22)',
  },
  libraryTabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  libraryTabEmoji: { fontSize: 16, lineHeight: 20 },
  libraryTabTextSelected: { color: theme.onAccent},
  content: { padding: 20, paddingBottom: 112 },
  createFab: { alignItems: 'center', borderRadius: 30, elevation: 6, height: 60, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: theme.ink, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, width: 60 },
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
  newFolderButton: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 13, flexDirection: 'row', gap: 7, minHeight: 46, paddingHorizontal: 15 },
  newFolderText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 18 },
  filterChip: {
    minHeight: 44,
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
  filterTextSelected: { color: theme.onAccent},
  viewToolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  viewToggle: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 13, borderWidth: 1.5, flexDirection: 'row', padding: 3 },
  viewOption: { alignItems: 'center', borderRadius: 9, height: 44, justifyContent: 'center', width: 44 },
  viewOptionSelected: { backgroundColor: theme.violetDeep },
  cardList: { gap: 10 },
  listCardList: { gap: 6 },
  cardGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardGridColumn: { flex: 1, minWidth: 0, gap: 18 },
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
  retryText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 13 },
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
  emptyButtonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  loadMoreButton: { alignSelf: 'center', marginTop: 16, borderRadius: 999, backgroundColor: theme.skyTint, paddingHorizontal: 18, paddingVertical: 10 },
  loadMoreText: { textAlign: 'center', color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  lessonEntry: { alignItems: 'center', backgroundColor: theme.sunTint, borderColor: theme.sunLine, borderRadius: 999, borderWidth: 1.5, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  lessonEntryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 10 }, lessonEntryArrow: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  loadingFrame: { height: 180, overflow: 'hidden', borderRadius: 20 },
}));
