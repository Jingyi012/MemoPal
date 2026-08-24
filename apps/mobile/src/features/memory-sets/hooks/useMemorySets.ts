import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      const memorySets = await memorySetApi.getAll();
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
    queryFn: () => memorySetApi.getById(memorySetId),
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
    mutationFn: (request: MemorySetUpsertRequest) => memorySetApi.create(request),
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
      memorySetApi.update(memorySetId, request),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const duplicateMemorySet = useMutation({
    mutationFn: (memorySetId: string) => memorySetApi.duplicate(memorySetId),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const setMemorySetArchived = useMutation({
    mutationFn: ({ memorySetId, isArchived }: { memorySetId: string; isArchived: boolean }) =>
      memorySetApi.setArchived(memorySetId, isArchived),
    retry: false,
    onSuccess: cacheMemorySet,
  });

  const deleteMemorySet = useMutation({
    mutationFn: (memorySetId: string) => memorySetApi.delete(memorySetId),
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
