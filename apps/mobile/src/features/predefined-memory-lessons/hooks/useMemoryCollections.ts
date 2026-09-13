import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoryCollectionsApi } from '../api/memoryCollections.api';
import { MEMORY_FOLDER_KEYS } from '@/features/library/queryKeys';
import { MEMORY_SET_KEYS } from '@/features/memory-sets';

export function useMemoryCollections() {
  return useQuery({ queryKey: ['memory-collections'], queryFn: memoryCollectionsApi.list, staleTime: 120000 });
}

export function useDownloadMemoryCollection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, language }: { id: string; language: 'en' | 'zh' }) => memoryCollectionsApi.download(id, language),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: MEMORY_FOLDER_KEYS.all }),
        client.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() }),
      ]);
    },
  });
}
