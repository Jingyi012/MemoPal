import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveLocalPreviewMemorySet,
  setLocalPreviewMemorySetVisibility,
  createLocalPreviewMemorySet,
  deleteLocalPreviewMemorySet,
  duplicateLocalPreviewMemorySet,
  getLocalPreviewMemorySet,
  getLocalPreviewMemorySets,
  isLocalPreviewEnabled,
  updateLocalPreviewMemorySet,
} from '@/core/dev/localPreviewData';
import { memorySetApi } from '../api/memorySet.api';
import { COMMUNITY_MEMORY_SET_KEYS, MEMORY_SET_KEYS } from '../queryKeys';
import type {
  MemorySet,
  MemorySetUpsertRequest,
  MemoryTechniqueKey,
} from '../types/memorySet.types';

export function useMemorySets(techniqueKey?: MemoryTechniqueKey) {
  return useQuery({
    queryKey: MEMORY_SET_KEYS.list(techniqueKey),
    queryFn: async () => {
      let memorySets: MemorySet[];
      try {
        memorySets = await memorySetApi.getAll();
      } catch (error) {
        if (!isLocalPreviewEnabled) throw error;
        memorySets = getLocalPreviewMemorySets();
      }
      return techniqueKey
        ? memorySets.filter((memorySet) => memorySet.techniqueKey === techniqueKey)
        : memorySets;
    },
    staleTime: 1000 * 60 * 2,
    networkMode: 'online',
  });
}

export function useInfiniteMemorySets(filters?: { folderId?: string; unfiled?: boolean }) {
  return useInfiniteQuery({
    queryKey: [...MEMORY_SET_KEYS.lists(), 'paged', filters ?? {}],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      try {
        return await memorySetApi.getPage(pageParam, 20, filters);
      } catch (error) {
        if (!isLocalPreviewEnabled) throw error;
        const all = getLocalPreviewMemorySets().filter((memorySet) => filters?.folderId
          ? memorySet.memoryFolderId === filters.folderId
          : filters?.unfiled
            ? !memorySet.memoryFolderId
            : true);
        const start = (pageParam - 1) * 20;
        return { items: all.slice(start, start + 20), pageNumber: pageParam, pageSize: 20, totalCount: all.length };
      }
    },
    getNextPageParam: (lastPage) => lastPage.pageNumber * lastPage.pageSize < lastPage.totalCount ? lastPage.pageNumber + 1 : undefined,
    staleTime: 1000 * 60 * 2,
    networkMode: 'online',
  });
}

export function useMemorySet(memorySetId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: MEMORY_SET_KEYS.detail(memorySetId),
    enabled: Boolean(memorySetId),
    queryFn: async () => {
      // Preview memory sets are intentionally client-only and do not exist in
      // the API database. Resolve those IDs before making a request so a
      // normal preview tap does not produce an expected backend 404 (and does
      // not trip a debugger configured to break on thrown exceptions).
      if (isLocalPreviewEnabled) {
        const previewMemorySet = getLocalPreviewMemorySet(memorySetId);
        if (previewMemorySet) return previewMemorySet;
      }

      try {
        return await memorySetApi.getById(memorySetId);
      } catch (error) {
        const previewMemorySet = isLocalPreviewEnabled
          ? getLocalPreviewMemorySet(memorySetId)
          : undefined;
        if (previewMemorySet) return previewMemorySet;
        throw error;
      }
    },
    placeholderData: () => {
      const lists = queryClient.getQueriesData<MemorySet[]>({
        queryKey: MEMORY_SET_KEYS.lists(),
      });
      return lists.flatMap(([, memorySets]) => memorySets ?? []).find((item) => item.id === memorySetId);
    },
    networkMode: 'online',
  });
}

export function useMemorySetMutations() {
  const queryClient = useQueryClient();

  const cacheMemorySet = (memorySet: MemorySet) => {
    queryClient.setQueryData(MEMORY_SET_KEYS.detail(memorySet.id), memorySet);
    void queryClient.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() });
    void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.all });
  };

  const createMemorySet = useMutation({
    mutationFn: (request: MemorySetUpsertRequest) =>
      isLocalPreviewEnabled ? Promise.resolve(createLocalPreviewMemorySet(request)) : memorySetApi.create(request),
    // Avoid duplicate POSTs until the API accepts an idempotency key.
    // The composer keeps the failed state visible and offers an explicit retry.
    retry: false,
    onSuccess: (created) => {
      queryClient.setQueryData(MEMORY_SET_KEYS.detail(created.id), created);
      queryClient.setQueryData<MemorySet[]>(MEMORY_SET_KEYS.list(created.techniqueKey), (current = []) => [
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
      void queryClient.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_MEMORY_SET_KEYS.all });
    },
  });

  const updateMemorySet = useMutation({
    mutationFn: ({ memorySetId, request }: { memorySetId: string; request: MemorySetUpsertRequest }) =>
      isLocalPreviewEnabled
        ? Promise.resolve(updateLocalPreviewMemorySet(memorySetId, request))
        : memorySetApi.update(memorySetId, request),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const duplicateMemorySet = useMutation({
    mutationFn: (memorySetId: string) =>
      isLocalPreviewEnabled
        ? Promise.resolve(duplicateLocalPreviewMemorySet(memorySetId))
        : memorySetApi.duplicate(memorySetId),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const setMemorySetArchived = useMutation({
    mutationFn: ({ memorySetId, isArchived }: { memorySetId: string; isArchived: boolean }) =>
      isLocalPreviewEnabled
        ? Promise.resolve(archiveLocalPreviewMemorySet(memorySetId, isArchived))
        : memorySetApi.setArchived(memorySetId, isArchived),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const setMemorySetVisibility = useMutation({
    mutationFn: ({ memorySetId, visibility, confirmPrivateAssets = false }: {
      memorySetId: string;
      visibility: 'private' | 'public';
      confirmPrivateAssets?: boolean;
    }) =>
      isLocalPreviewEnabled
        ? Promise.resolve(setLocalPreviewMemorySetVisibility(memorySetId, visibility))
        : memorySetApi.setVisibility(memorySetId, visibility, confirmPrivateAssets),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const deleteMemorySet = useMutation({
    mutationFn: (memorySetId: string) => {
      if (isLocalPreviewEnabled) {
        deleteLocalPreviewMemorySet(memorySetId);
        return Promise.resolve();
      }
      return memorySetApi.delete(memorySetId);
    },
    retry: false,
    onSuccess: (_, memorySetId) => {
      queryClient.removeQueries({ queryKey: MEMORY_SET_KEYS.detail(memorySetId) });
      void queryClient.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: ['practice-attempts'] });
    },
  });

  const moveMemorySet = useMutation({
    mutationFn: ({ memorySetId, folderId }: { memorySetId: string; folderId: string | null }) => memorySetApi.moveToFolder(memorySetId, folderId),
    retry: false,
    onSuccess: (memorySet) => {
      queryClient.setQueryData(MEMORY_SET_KEYS.detail(memorySet.id), memorySet);
      void queryClient.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() });
      void queryClient.invalidateQueries({ queryKey: ['memory-folders'] });
    },
  });

  return {
    createMemorySet,
    updateMemorySet,
    duplicateMemorySet,
    setMemorySetArchived,
    setMemorySetVisibility,
    deleteMemorySet,
    moveMemorySet,
  };
}
