import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetCard } from '@/components/MemorySetCard';
import { AppButton } from '@/components/ui/AppButton';
import { useMemoryFolderMutations, useMemoryFolders } from '../hooks/useMemoryFolders';
import { useInfiniteMemorySets, useMemorySetMutations } from '@/features/memory-sets';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Plus, RefreshCcw } from '@/core/icons';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MemoryFolderDetailScreen() {
  const { styles } = useStyles();
  const { t } = useTranslation('library');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userState } = useUserState();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const params = useLocalSearchParams<{ folderId?: string | string[] }>();
  const folderId = Array.isArray(params.folderId) ? params.folderId[0] : params.folderId;
  const folderQuery = useMemoryFolders();
  const setsQuery = useInfiniteMemorySets(folderId ? { folderId } : undefined);
  const { createFolder, renameFolder } = useMemoryFolderMutations();
  const { duplicateMemorySet, setMemorySetArchived, setMemorySetVisibility, deleteMemorySet, moveMemorySet } = useMemorySetMutations();
  const actionsRef = useRef<BottomSheetModal>(null);
  const pendingAfterDismissRef = useRef<(() => void) | undefined>(undefined);
  const [actionMemorySet, setActionMemorySet] = useState<MemorySet>();
  const [moveMemory, setMoveMemory] = useState<MemorySet>();
  const [newFolderMemory, setNewFolderMemory] = useState<MemorySet>();
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
    dismissActionsThen(() => Alert.alert(t('deleteTitle'), memorySet.title, [
      { text: t('keepMemory'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteMemorySet.mutate(memorySet.id, {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: t('memoryDeleted') });
          void InAppNotificationSync.syncAllUpcoming(userState.notifications.reviewReminders, userState.preferences.language);
        },
        onError: (error) => Toast.show({ type: 'error', text1: t('deleteError'), text2: getNumberPegErrorMessage(error, t('deleteError')) }),
      }) },
    ]));
  };

  const requestVisibilityChange = (memorySet: MemorySet) => {
    const visibility = memorySet.visibility === 'public' ? 'private' : 'public';
    dismissActionsThen(() => Alert.alert(
      visibility === 'public' ? t('makePublicTitle') : t('makePrivateTitle'),
      visibility === 'public' ? t('makePublicDescription') : t('makePrivateDescription'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: visibility === 'public' ? t('makePublic') : t('makePrivate'), onPress: () => setMemorySetVisibility.mutate({ memorySetId: memorySet.id, visibility, confirmPrivateAssets: visibility === 'public' }, {
          onSuccess: () => Toast.show({ type: 'success', text1: visibility === 'public' ? t('memoryPublished') : t('memoryPrivate') }),
          onError: (error) => Toast.show({ type: 'error', text1: t('visibilityError'), text2: getNumberPegErrorMessage(error, t('visibilityError')) }),
        }) },
      ],
    ));
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
    <CommonHeader eyebrow={t('folderEyebrow')} title={folder?.name ?? t('folder')} description={folder ? `${folder.memorySetCount} ${folder.memorySetCount === 1 ? t('list') : t('lists')} · ${folder.itemCount} ${folder.itemCount === 1 ? t('item') : t('items')}` : undefined} backAction={() => router.back()} actions={[{ icon: Pencil, accessibilityLabel: t('editCollection'), onPress: openFolderEditor }]} />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={setsQuery.isRefetching} onRefresh={() => { void Promise.allSettled([folderQuery.refetch(), setsQuery.refetch()]); }} />}>
      {sets.length ? (
        <View style={[styles.list, userState.ui.libraryViewMode !== 'list' && styles.cardGrid]}>
          {sets.map((memorySet) => (
            <View key={memorySet.id} style={userState.ui.libraryViewMode === 'list' ? undefined : styles.cardGridCell}>
              <MemorySetCard
                memorySet={memorySet}
                onOpen={() => router.push(`/memory-details/${memorySet.id}` as Href)}
                onActions={() => { setActionMemorySet(memorySet); actionsRef.current?.present(); }}
                layout={userState.ui.libraryViewMode === 'list' ? 'row' : 'grid'}
                variant={userState.ui.libraryViewMode === 'list' ? 'list' : 'card'}
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
    <AppButton accessibilityLabel={t('create')} accessibilityHint={t('newMemoryBody')} variant="primary" icon={Plus} onPress={() => router.push(`/create-memory?memoryFolderId=${encodeURIComponent(folderId ?? '')}` as Href)} style={[styles.createFab, { bottom: Math.max(16, insets.bottom + 10) }]} />
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
  page: { flex: 1, backgroundColor: 'transparent' }, content: { padding: 20, paddingBottom: 112 }, createFab: { alignItems: 'center', borderRadius: 30, elevation: 6, height: 60, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: theme.ink, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, width: 60 }, loading: { height: 180, borderRadius: 20, overflow: 'hidden' }, list: { gap: 8 }, cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }, cardGridCell: { width: '48.5%' }, notice: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 2, padding: 22 }, empty: { fontSize: 32, marginBottom: 8 }, noticeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, textAlign: 'center' }, noticeBody: { color: theme.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' }, retry: { alignSelf: 'center', marginTop: 14 }, create: { alignSelf: 'center', marginTop: 15 }, loadMore: { alignSelf: 'center', marginTop: 16 },
}));
