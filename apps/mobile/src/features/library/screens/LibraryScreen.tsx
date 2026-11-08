import { useAuth } from '@/contexts/AuthProvider';
import { SpotlightTarget, usePageTour } from '@/features/onboarding/components/SpotlightTourProvider';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { AppButton } from '@/components/ui/AppButton';
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
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Href, useRouter } from 'expo-router';
import { Archive, Check, CircleHelp, Globe2, Layers, LayoutGrid, List as ListIcon, LockKeyhole, Plus, RefreshCcw, Sparkles, Trash2 } from '@/core/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MemoryActionsSheet } from '../components/MemoryActionsSheet';
import { MemoryFolderCard } from '../components/MemoryFolderCard';
import { MemoryFolderActionsSheet } from '../components/MemoryFolderActionsSheet';
import { FolderNameModal } from '../components/FolderNameModal';
import { MemoryMoveModal } from '../components/MemoryMoveModal';

type LibraryFilter = 'all' | MemoryTechniqueKey | 'archived';
type LibraryViewMode = 'card' | 'list';

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
  const replayTour = usePageTour('libraryPage', authUser?.onboardingStatus === 'not-started', true);
  useEffect(() => {
    if (!replayRequested) return;
    setReplayRequested(false);
    replayTour();
  }, [replayRequested, replayTour]);
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
  const showFolders = filter === 'all';
  const hasExplorerEntries = (showFolders && folders.length > 0) || visibleSets.length > 0;
  const explorerHasError = canShowRequestErrors && (foldersQuery.isError || pagedMemorySets.isError);
  const explorerIsLoading = !hasExplorerEntries && !isOffline &&
    (foldersQuery.isLoading || pagedMemorySets.isLoading);
  const showCreateFab = filter !== 'archived' && (hasExplorerEntries || explorerIsLoading || explorerHasError || isOffline);
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
    setTimeout(() => {
      const pending = pendingCollectionActionRef.current;
      if (!pending) return;
      pendingCollectionActionRef.current = undefined;
      setActionCollection(undefined);
      pending();
    }, 260);
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
        actions={[{ icon: CircleHelp, onPress: () => setReplayRequested(true), accessibilityLabel: tourT('guideEntry') }]}
        additionalContent={<View style={{ alignItems: 'flex-start' }}>
          <AppButton label={t('memoryTools')} icon={Sparkles} variant="secondary" size="compact"
            onPress={() => router.push('/(tabs)/practice' as Href)} />
        </View>}
        hideBackButton
      />

      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pagedMemorySets.isRefetching || foldersQuery.isRefetching || dueReviews.isRefetching || upcomingReviews.isRefetching}
            onRefresh={() => { void Promise.allSettled([pagedMemorySets.refetch(), foldersQuery.refetch(), palaceScenes.refetch(), dueReviews.refetch(), upcomingReviews.refetch()]); }}
          />
        }>
        <SpotlightTarget id="libraryFilter" onReveal={revealTop}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filterRow}
            showsHorizontalScrollIndicator={false}>
            {filters.map((item) => {
              const selected = item.key === filter;
              return (
                <AnimatedPressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}>
                  {selected && item.key !== 'archived' ? <Check size={14} color={theme.violetDeep} /> : null}
                  {item.key === 'archived' ? <Archive size={14} color={selected ? theme.violetDeep : theme.inkSoft} /> : null}
                  <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                    {item.key === 'all' ? t('all') : item.key === 'palace' ? t('palaces') : item.key === 'number-peg' ? t('numberPeg') : t('archived')}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </SpotlightTarget>
        <View style={styles.viewToolbar}>
          {filter !== 'archived' ? <AppButton
            label={t('newFolder')}
            variant="secondary"
            size="compact"
            icon={Layers}
            onPress={() => setFolderNameModal({})}
          /> : <View style={styles.toolbarSpacer} />}
          <View accessibilityLabel={t('viewMode')} style={styles.viewToggle}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('cardView')}
              accessibilityState={{ selected: viewMode === 'card' }}
              hitSlop={4}
              onPress={() => changeViewMode('card')}
              style={[styles.viewOption, viewMode === 'card' && styles.viewOptionSelected]}>
              <LayoutGrid size={16} color={theme.violetDeep} />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={t('listView')}
              accessibilityState={{ selected: viewMode === 'list' }}
              hitSlop={4}
              onPress={() => changeViewMode('list')}
              style={[styles.viewOption, viewMode === 'list' && styles.viewOptionSelected]}>
              <ListIcon size={16} color={theme.violetDeep} />
            </AnimatedPressable>
          </View>
        </View>

        {explorerHasError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{t('unavailable')}</Text>
            <Text style={styles.noticeBody}>{t('connectionRetry')}</Text>
            <AppButton
              label={t('retry')}
              size="compact"
              icon={RefreshCcw}
              onPress={() => { void Promise.allSettled([foldersQuery.refetch(), pagedMemorySets.refetch()]); }}
              style={styles.retryButton}
            />
          </View>
        ) : null}

        {explorerIsLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description={t('loading')} />
          </View>
        ) : hasExplorerEntries ? (
          <View style={styles.librarySections}>
            {showFolders && folders.length ? (
              <View style={styles.librarySection}>
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionTitleGroup}>
                    <Text style={styles.sectionTitle}>{t('folders')}</Text>
                    <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{folders.length}</Text></View>
                  </View>
                </View>
                {viewMode === 'card' ? (
                  <View style={styles.cardGrid}>
                    {folders.map((folder, index) => (
                      <View key={`folder-cell-${folder.id}`} style={styles.cardGridCell}>
                        {renderFolderCard(folder, index, 'card')}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.cardList, styles.listCardList]}>
                    {folders.map((folder, index) => renderFolderCard(folder, index, 'list'))}
                  </View>
                )}
              </View>
            ) : null}
            {visibleSets.length ? (
              <View style={styles.librarySection}>
                <View style={styles.sectionHeading}>
                  <View style={styles.sectionTitleGroup}>
                    <Text style={styles.sectionTitle}>{filter === 'archived' ? t('archived') : t('myMemories')}</Text>
                    <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{visibleSets.length}</Text></View>
                  </View>
                </View>
                {viewMode === 'card' ? (
                  <View style={styles.cardGrid}>
                    {visibleSets.map((memorySet) => (
                      <View key={`memory-cell-${memorySet.id}`} style={styles.cardGridCell}>
                        {renderMemorySetCard(memorySet, 'card')}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.cardList, styles.listCardList]}>
                    {visibleSets.map((memorySet) => renderMemorySetCard(memorySet, 'list'))}
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : !isOffline && !explorerHasError && filter === 'all' ? (
          <SpotlightTarget id="libraryStarter" onReveal={revealTop} onActivate={createMemory}>
            <ModuleNoticeCard
              icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
              title={t('newMemory')}
              body={t('newMemoryBody')}
              actionLabel={t('tapToStart')}
              actionIcon={<Plus size={15} color={theme.onAccent} />}
              onAction={createMemory}
            />
          </SpotlightTarget>
        ) : !isOffline && !explorerHasError ? (
          <View style={styles.noticeCard}>
            <Text style={styles.emptyEmoji}>{filter === 'palace' ? '🏡' : filter === 'number-peg' ? '🦢' : '📦'}</Text>
            <Text style={styles.noticeTitle}>{filter === 'archived' ? t('archiveEmpty') : t('collectionEmpty')}</Text>
            <Text style={styles.noticeBody}>{filter === 'archived' ? t('archiveBody') : t('buildFirstBody')}</Text>
            {filter !== 'archived' ? <AppButton label={t('create')} icon={Plus} onPress={createMemory} style={styles.emptyButton} /> : null}
          </View>
        ) : null}
        {!isOffline && pagedMemorySets.hasNextPage && !pagedMemorySets.isFetchingNextPage ? (
          <AppButton
            label={t('loadMore')}
            variant="secondary"
            size="compact"
            onPress={() => void pagedMemorySets.fetchNextPage()}
            style={styles.loadMoreButton}
          />
        ) : pagedMemorySets.isFetchingNextPage ? <Text style={styles.loadMoreText}>{t('loading')}</Text> : null}
      </ScrollView>
      {showCreateFab ? (
        <View style={[styles.createFabAnchor, { bottom: Math.max(16, insets.bottom + 10) }]}>
          <SpotlightTarget id="libraryStarter" onReveal={revealTop} onActivate={createMemory}>
            <AppButton
              accessibilityLabel={t('create')}
              accessibilityHint={t('newMemoryBody')}
              variant="primary"
              icon={Plus}
              onPress={createMemory}
              style={styles.createFab}
            />
          </SpotlightTarget>
        </View>
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
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 128 },
  createFabAnchor: { alignItems: 'center', height: 60, justifyContent: 'center', position: 'absolute', right: 18, width: 60, zIndex: 5 },
  createFab: { alignItems: 'center', borderRadius: 30, elevation: 6, height: 60, justifyContent: 'center', shadowColor: theme.ink, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, width: 60 },
  filterRow: { alignItems: 'center', flexDirection: 'row', gap: 7, paddingVertical: 12 },
  filterChip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.paper,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  filterChipSelected: { borderColor: theme.violetLine, backgroundColor: theme.violetTint },
  filterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  filterTextSelected: { color: theme.violetDeep },
  viewToolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 1 },
  toolbarSpacer: { flex: 1 },
  viewToggle: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 13, borderWidth: 1, flexDirection: 'row', padding: 3 },
  viewOption: { alignItems: 'center', borderRadius: 9, height: 44, justifyContent: 'center', width: 44 },
  viewOptionSelected: { backgroundColor: theme.paper, boxShadow: '0px 2px 5px rgba(73,55,154,0.12)' },
  librarySections: { gap: 22 },
  librarySection: { gap: 11 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 28 },
  sectionTitleGroup: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 },
  sectionCount: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, minWidth: 24, paddingHorizontal: 7, paddingVertical: 3 },
  sectionCountText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  cardList: { gap: 10 },
  listCardList: { gap: 9 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  cardGridCell: { width: '48.5%' },
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
  retryButton: { alignSelf: 'center', marginTop: 14 },
  emptyIconEmoji: { fontSize: 24 },
  emptyEmoji: { fontSize: 32, marginBottom: 9 },
  emptyButton: { alignSelf: 'center', marginTop: 15 },
  loadMoreButton: { alignSelf: 'center', marginTop: 16 },
  lessonEntry: { alignItems: 'center', backgroundColor: theme.sunTint, borderColor: theme.sunLine, borderRadius: 999, borderWidth: 1.5, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  lessonEntryTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 10 }, lessonEntryArrow: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  loadMoreText: { alignSelf: 'center', color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 16 },
  loadingFrame: { height: 180, overflow: 'hidden', borderRadius: 20 },
}));
