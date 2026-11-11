import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemoryLibraryItemCard } from '../components/MemoryLibraryItemCard';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LearningIconButton } from '@/features/education/components/LearningIconButton';
import { usePalaceScenes } from '@/features/palace-scenes';
import { useDueMemoryReviews, useUpcomingMemoryReviews } from '@/features/practice-attempts';
import { AppButton } from '@/components/ui/AppButton';
import { useMemoryFolderMutations, useMemoryFolders } from '../hooks/useMemoryFolders';
import { useInfiniteMemorySets, useMemorySetMutations } from '@/features/memory-sets';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Plus, RefreshCcw } from '@/core/icons';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { MemoryActionsSheet } from '../components/MemoryActionsSheet';
import type { MemorySet } from '@/features/memory-sets';
import Toast from 'react-native-toast-message';
import { FolderNameModal } from '../components/FolderNameModal';
import { MemoryMoveModal } from '../components/MemoryMoveModal';
import type { MemoryFolder, MemoryFolderCreateRequest } from '../types/memoryFolder.types';
import { useUserState } from '@/contexts/UserStateContext';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function MemoryFolderDetailScreen() {
  const { styles } = useStyles();
  const { t } = useTranslation('library');
  const router = useRouter();
  const { userState, updateState } = useUserState();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const params = useLocalSearchParams<{ folderId?: string | string[] }>();
  const folderId = Array.isArray(params.folderId) ? params.folderId[0] : params.folderId;
  const folderQuery = useMemoryFolders();
  const palaceScenes = usePalaceScenes();
  const dueReviews = useDueMemoryReviews();
  const upcomingReviews = useUpcomingMemoryReviews(30);
  const grid = userState.ui.libraryViewMode !== 'list';
  const createMemory = () => router.push(`/create-memory?memoryFolderId=${encodeURIComponent(folderId ?? '')}` as Href);
  const toggleView = () => void updateState({ ui: { ...userState.ui, libraryViewMode: grid ? 'list' : 'card' } });
  const setsQuery = useInfiniteMemorySets(folderId ? { folderId } : undefined);
  const { createFolder, renameFolder } = useMemoryFolderMutations();
  const { duplicateMemorySet, setMemorySetArchived, setMemorySetVisibility, deleteMemorySet, moveMemorySet } = useMemorySetMutations();
  const actionsRef = useRef<BottomSheetModal>(null);
  const pendingAfterDismissRef = useRef<(() => void) | undefined>(undefined);
  const [actionMemorySet, setActionMemorySet] = useState<MemorySet>();
  const [moveMemory, setMoveMemory] = useState<MemorySet>();
  const [newFolderMemory, setNewFolderMemory] = useState<MemorySet>();
  const [deleteConfirmationMemory, setDeleteConfirmationMemory] = useState<MemorySet>();
  const [visibilityConfirmationMemory, setVisibilityConfirmationMemory] = useState<MemorySet>();
  const [editFolder, setEditFolder] = useState<MemoryFolder>();
  const folder = folderQuery.data?.find((item) => item.id === folderId);
  const folders = folderQuery.data ?? [];
  const sets = setsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const dismissActionsThen = (action: () => void) => {
    pendingAfterDismissRef.current = action;
    actionsRef.current?.dismiss();
  };

  const handleActionsDismiss = () => {
    setActionMemorySet(undefined);
    const action = pendingAfterDismissRef.current;
    pendingAfterDismissRef.current = undefined;
    action?.();
  };

  const moveSelectedMemory = (memorySet: MemorySet) => {
    dismissActionsThen(() => setMoveMemory(memorySet));
  };

  const duplicateSelectedMemory = (memorySet: MemorySet) => {
    duplicateMemorySet.mutate(memorySet.id, {
      onSuccess: (copy) => { actionsRef.current?.dismiss(); Toast.show({ type: 'success', text1: `“${copy.title}” ${t('readyInLibrary')}` }); },
      onError: (error) => { actionsRef.current?.dismiss(); Toast.show({ type: 'error', text1: t('duplicateError'), text2: getNumberPegErrorMessage(error, t('duplicateError')) }); },
    });
  };

  const toggleSelectedMemoryArchived = (memorySet: MemorySet) => {
    const isArchived = memorySet.status === 'archived';
    setMemorySetArchived.mutate({ memorySetId: memorySet.id, isArchived: !isArchived }, {
      onSuccess: () => { actionsRef.current?.dismiss(); Toast.show({ type: 'success', text1: isArchived ? t('memoryRestored') : t('memoryArchived') }); },
      onError: (error) => { actionsRef.current?.dismiss(); Toast.show({ type: 'error', text1: t('updateError'), text2: getNumberPegErrorMessage(error, t('updateError')) }); },
    });
  };

  const requestDeleteMemory = (memorySet: MemorySet) => {
    dismissActionsThen(() => setDeleteConfirmationMemory(memorySet));
  };
  const confirmDeleteMemory = () => {
    if (!deleteConfirmationMemory) return;
    deleteMemorySet.mutate(deleteConfirmationMemory.id, {
      onSuccess: () => {
        setDeleteConfirmationMemory(undefined);
        Toast.show({ type: 'success', text1: t('memoryDeleted') });
        void InAppNotificationSync.syncAllUpcoming(userState.notifications.reviewReminders, userState.preferences.language);
      },
      onError: (error) => Toast.show({ type: 'error', text1: t('deleteError'), text2: getNumberPegErrorMessage(error, t('deleteError')) }),
    });
  };
  const requestVisibilityChange = (memorySet: MemorySet) => {
    dismissActionsThen(() => setVisibilityConfirmationMemory(memorySet));
  };
  const makePublic = visibilityConfirmationMemory?.visibility !== 'public';
  const confirmVisibilityChange = () => {
    if (!visibilityConfirmationMemory) return;
    setMemorySetVisibility.mutate({ memorySetId: visibilityConfirmationMemory.id, visibility: makePublic ? 'public' : 'private', confirmPrivateAssets: makePublic }, {
      onSuccess: () => { setVisibilityConfirmationMemory(undefined); Toast.show({ type: 'success', text1: t(makePublic ? 'memoryPublished' : 'memoryPrivate') }); },
      onError: (error) => Toast.show({ type: 'error', text1: t('visibilityError'), text2: getNumberPegErrorMessage(error, t('visibilityError')) }),
    });
  };

  const createFolderAndMove = (collection: MemoryFolderCreateRequest) => {
    const memorySet = newFolderMemory;
    if (!memorySet) return;
    createFolder.mutate(collection, {
      onSuccess: (created) => {
        setNewFolderMemory(undefined);
        moveMemorySet.mutate({ memorySetId: memorySet.id, folderId: created.id }, {
        onSuccess: () => Toast.show({ type: 'success', text1: t('memoryMoved') }),
        onError: () => Toast.show({ type: 'error', text1: t('moveError') }),
        });
      },
      onError: () => Toast.show({ type: 'error', text1: t('folderError') }),
    });
  };
  const updateFolder = (collection: MemoryFolderCreateRequest) => {
    if (!editFolder) return;
    renameFolder.mutate({ folderId: editFolder.id, request: collection }, {
      onSuccess: () => { setEditFolder(undefined); Toast.show({ type: 'success', text1: t('folderRenamed') }); },
      onError: () => Toast.show({ type: 'error', text1: t('folderError') }),
    });
  };
  const openFolderEditor = () => {
    if (folder) {
      setEditFolder(folder);
      return;
    }
    void folderQuery.refetch().then((result) => {
      const refreshed = result.data?.find((item) => item.id === folderId);
      if (refreshed) setEditFolder(refreshed);
    });
  };
  return <View style={styles.page}>
    <CommonHeader eyebrow={t('folderEyebrow')} title={folder?.name ?? t('folder')} description={folder ? `${folder.memorySetCount} ${folder.memorySetCount === 1 ? t('list') : t('lists')} · ${folder.itemCount} ${folder.itemCount === 1 ? t('item') : t('items')}` : undefined} backAction={() => router.back()} actions={[{ icon: Pencil, accessibilityLabel: t('editCollection'), onPress: openFolderEditor }, { icon: Plus, accessibilityLabel: t('create'), onPress: createMemory }]} />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={setsQuery.isRefetching} onRefresh={() => { void Promise.allSettled([folderQuery.refetch(), setsQuery.refetch()]); }} />}>
      <View style={styles.toolbar}><Text style={styles.noticeBody}>{t('myMemories')}</Text><LearningIconButton variant="plain" icon={grid ? 'list-outline' : 'grid-outline'} label={grid ? t('listView') : t('cardView')} onPress={toggleView} /></View>
      {sets.length ? (
        <View style={[styles.list, userState.ui.libraryViewMode !== 'list' && styles.cardGrid]}>
          {sets.map((memorySet) => (
            <View key={memorySet.id} style={userState.ui.libraryViewMode === 'list' ? undefined : styles.cardGridCell}>
              <MemoryLibraryItemCard
                memorySet={memorySet}
                onOpen={() => router.push(`/memory-details/${memorySet.id}` as Href)}
                onActions={() => { setActionMemorySet(memorySet); actionsRef.current?.present(); }}
                layout={userState.ui.libraryViewMode === 'list' ? 'row' : 'grid'}
                reviewAt={[...(dueReviews.data ?? []), ...(upcomingReviews.data ?? [])].filter(review => review.memorySetId === memorySet.id).sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))[0]?.dueAt}
                coverImageUrl={palaceScenes.data?.find(scene => scene.id === memorySet.techniquePlan?.palaceSceneId)?.imageUrl}
                coverImageSource={palaceScenes.data?.find(scene => scene.id === memorySet.techniquePlan?.palaceSceneId)?.imageSource}
              />
            </View>
          ))}
        </View>
      ) : !isOffline && setsQuery.isLoading ? (
        <View style={styles.loading}><LoadingView description={t('loading')} /></View>
      ) : canShowRequestErrors && setsQuery.isError ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{t('unavailable')}</Text>
          <Text style={styles.noticeBody}>{getNumberPegErrorMessage(setsQuery.error, t('connectionRetry'))}</Text>
          <AppButton label={t('retry')} size="compact" icon={RefreshCcw} onPress={() => setsQuery.refetch()} style={styles.retry} />
        </View>
      ) : !isOffline ? (
        <View style={styles.notice}>
          <Text style={styles.empty}>{folder?.emoji ?? '📚'}</Text>
          <Text style={styles.noticeTitle}>{t('folderEmpty')}</Text>
          <Text style={styles.noticeBody}>{t('folderEmptyBody')}</Text>
          <AppButton label={t('create')} icon={Plus} onPress={() => router.push(`/create-memory?memoryFolderId=${encodeURIComponent(folderId ?? '')}` as Href)} style={styles.create} />
        </View>
      ) : null}
      {!isOffline && setsQuery.hasNextPage ? <AppButton label={t('loadMore')} variant="secondary" size="compact" onPress={() => void setsQuery.fetchNextPage()} style={styles.loadMore} /> : null}
    </ScrollView>
    <MemoryActionsSheet
      ref={actionsRef}
      memorySet={actionMemorySet}
      onDismiss={handleActionsDismiss}
      onDuplicate={duplicateSelectedMemory}
      onToggleArchived={toggleSelectedMemoryArchived}
      onDelete={requestDeleteMemory}
      onRequestVisibility={requestVisibilityChange}
      onMove={moveSelectedMemory}
      isBusy={duplicateMemorySet.isPending || setMemorySetArchived.isPending || setMemorySetVisibility.isPending || deleteMemorySet.isPending || moveMemorySet.isPending}
    />
    <ConfirmModal visible={!!deleteConfirmationMemory} destructive subject={deleteConfirmationMemory?.title} title={t('deleteTitle')} confirmText={t('delete')} cancelText={t('keepMemory')} isLoading={deleteMemorySet.isPending} onConfirm={confirmDeleteMemory} onCancel={() => { if (!deleteMemorySet.isPending) setDeleteConfirmationMemory(undefined); }} />
    <ConfirmModal visible={!!visibilityConfirmationMemory} title={t(makePublic ? 'makePublicTitle' : 'makePrivateTitle')} description={t(makePublic ? 'makePublicDescription' : 'makePrivateDescription')} confirmText={t(makePublic ? 'makePublic' : 'makePrivate')} cancelText={t('cancel')} isLoading={setMemorySetVisibility.isPending} onConfirm={confirmVisibilityChange} onCancel={() => { if (!setMemorySetVisibility.isPending) setVisibilityConfirmationMemory(undefined); }} />
    <FolderNameModal visible={Boolean(newFolderMemory)} isLoading={createFolder.isPending || moveMemorySet.isPending} onCancel={() => setNewFolderMemory(undefined)} onSubmit={createFolderAndMove} />
    <FolderNameModal visible={Boolean(editFolder)} initialName={editFolder?.name} initialEmoji={editFolder?.emoji} initialDescription={editFolder?.description} isLoading={renameFolder.isPending} onCancel={() => setEditFolder(undefined)} onSubmit={updateFolder} />
    <MemoryMoveModal
      memorySet={moveMemory}
      folders={folders}
      isLoading={moveMemorySet.isPending}
      onCancel={() => setMoveMemory(undefined)}
      onCreateFolder={() => {
        setNewFolderMemory(moveMemory);
        setMoveMemory(undefined);
      }}
      onSelect={(targetFolderId) => {
        const memorySet = moveMemory;
        if (!memorySet) return;
        setMoveMemory(undefined);
        moveMemorySet.mutate({ memorySetId: memorySet.id, folderId: targetFolderId }, { onSuccess: () => Toast.show({ type: 'success', text1: t('memoryMoved') }), onError: () => Toast.show({ type: 'error', text1: t('moveError') }) });
      }}
    />
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas }, toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: appSpacing.md }, content: { padding: appSpacing.lg, paddingTop: 0, paddingBottom: appSpacing.section }, loading: { height: 180, borderRadius: appRadii.card, overflow: 'hidden' }, list: { gap: appSpacing.sm }, cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }, cardGridCell: { width: '48.5%' }, notice: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.card, borderWidth: 2, padding: 22 }, empty: { fontSize: appTextStyles.display.fontSize, marginBottom: appSpacing.sm }, noticeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize, textAlign: 'center' }, noticeBody: { color: theme.inkSoft, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 5, textAlign: 'center' }, retry: { alignSelf: 'center', marginTop: 14 }, create: { alignSelf: 'center', marginTop: 15 }, loadMore: { alignSelf: 'center', marginTop: appSpacing.lg },
}));
