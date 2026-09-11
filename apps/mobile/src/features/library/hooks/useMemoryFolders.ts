import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoryFolderApi } from '../api/memoryFolder.api';
import { MEMORY_FOLDER_KEYS } from '../queryKeys';
import { MEMORY_SET_KEYS } from '@/features/memory-sets';
import type { MemoryFolderCreateRequest, MemoryFolderUpdateRequest } from '../types/memoryFolder.types';

export function useMemoryFolders() {
  return useQuery({
    queryKey: MEMORY_FOLDER_KEYS.list(),
    queryFn: memoryFolderApi.getAll,
    staleTime: 1000 * 60 * 2,
    networkMode: 'online',
  });
}

export function useMemoryFolderMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: MEMORY_FOLDER_KEYS.all });
    void queryClient.invalidateQueries({ queryKey: MEMORY_SET_KEYS.lists() });
  };

  const createFolder = useMutation({
    mutationFn: (request: MemoryFolderCreateRequest) => memoryFolderApi.create(request),
    retry: false,
    onSuccess: invalidate,
  });
  const renameFolder = useMutation({
    mutationFn: ({ folderId, request }: { folderId: string; request: MemoryFolderUpdateRequest }) => memoryFolderApi.update(folderId, request),
    retry: false,
    onSuccess: invalidate,
  });
  const deleteFolder = useMutation({
    mutationFn: (folderId: string) => memoryFolderApi.delete(folderId),
    retry: false,
    onSuccess: invalidate,
  });
  return { createFolder, renameFolder, deleteFolder };
}
