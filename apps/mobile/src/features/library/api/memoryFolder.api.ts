import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { MemoryFolder, MemoryFolderCreateRequest, MemoryFolderUpdateRequest } from '../types/memoryFolder.types';

function unwrap<T>(response: GeneralResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallbackMessage);
  return response.data;
}

export const memoryFolderApi = {
  async getAll(): Promise<MemoryFolder[]> {
    const response = await api.get<GeneralResponse<MemoryFolder[]>>('/v1/memory-folders');
    return unwrap(response.data, 'Could not load your collections.');
  },
  async create(request: MemoryFolderCreateRequest): Promise<MemoryFolder> {
    const response = await api.post<GeneralResponse<MemoryFolder>>('/v1/memory-folders', request);
    return unwrap(response.data, 'Could not create this collection.');
  },
  async update(folderId: string, request: MemoryFolderUpdateRequest): Promise<MemoryFolder> {
    const response = await api.patch<GeneralResponse<MemoryFolder>>(`/v1/memory-folders/${encodeURIComponent(folderId)}`, request);
    return unwrap(response.data, 'Could not update this collection.');
  },
  async delete(folderId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<boolean>>(`/v1/memory-folders/${encodeURIComponent(folderId)}`);
    unwrap(response.data, 'Could not delete this collection.');
  },
};
