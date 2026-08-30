import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveLocalPreviewMemorySet,
  createLocalPreviewMemorySet,
  deleteLocalPreviewMemorySet,
  duplicateLocalPreviewMemorySet,
  getLocalPreviewMemorySet,
  getLocalPreviewMemorySets,
  isLocalPreviewEnabled,
  updateLocalPreviewMemorySet,
} from '@/core/dev/localPreviewData';
import { memorySetApi } from '../api/memorySet.api';
import { MEMORY_SET_KEYS } from '../queryKeys';
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
    },
  });

  return {
    createMemorySet,
    updateMemorySet,
    duplicateMemorySet,
    setMemorySetArchived,
    deleteMemorySet,
  };
}
