import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { MemorySet, MemorySetUpsertRequest } from '../types/memorySet.types';

function unwrap<T>(response: GeneralResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.data == null) {
    throw new Error(response.message ?? fallbackMessage);
  }
  return response.data;
}

export const memorySetApi = {
  async getAll(): Promise<MemorySet[]> {
    const response = await api.get<GeneralResponse<MemorySet[]>>('/v1/memory-sets');
    return unwrap(response.data, 'Could not load your memory sets.');
  },

  async getById(memorySetId: string): Promise<MemorySet> {
    const response = await api.get<GeneralResponse<MemorySet>>(
      `/v1/memory-sets/${encodeURIComponent(memorySetId)}`
    );
    return unwrap(response.data, 'Could not load this memory set.');
  },

  async create(request: MemorySetUpsertRequest): Promise<MemorySet> {
    const response = await api.post<GeneralResponse<MemorySet>>('/v1/memory-sets', request);
    return unwrap(response.data, 'Could not save this memory set.');
  },

  async update(memorySetId: string, request: MemorySetUpsertRequest): Promise<MemorySet> {
    const response = await api.put<GeneralResponse<MemorySet>>(
      `/v1/memory-sets/${encodeURIComponent(memorySetId)}`,
      request
    );
    return unwrap(response.data, 'Could not update this memory set.');
  },

  async duplicate(memorySetId: string): Promise<MemorySet> {
    const response = await api.post<GeneralResponse<MemorySet>>(
      `/v1/memory-sets/${encodeURIComponent(memorySetId)}/duplicate`
    );
    return unwrap(response.data, 'Could not duplicate this memory set.');
  },

  async setArchived(memorySetId: string, isArchived: boolean): Promise<MemorySet> {
    const action = isArchived ? 'archive' : 'restore';
    const response = await api.patch<GeneralResponse<MemorySet>>(
      `/v1/memory-sets/${encodeURIComponent(memorySetId)}/${action}`
    );
    return unwrap(
      response.data,
      isArchived ? 'Could not archive this memory set.' : 'Could not restore this memory set.'
    );
  },

  async setVisibility(
    memorySetId: string,
    visibility: 'private' | 'public',
    confirmPrivateAssets = false,
  ): Promise<MemorySet> {
    const response = await api.patch<GeneralResponse<MemorySet>>(
      `/v1/memory-sets/${encodeURIComponent(memorySetId)}/visibility`,
      { visibility, confirmPrivateAssets },
    );
    return unwrap(response.data, 'Could not update this memory visibility.');
  },

  async delete(memorySetId: string): Promise<void> {
    const response = await api.delete<GeneralResponse<boolean>>(
      `/v1/memory-sets/${encodeURIComponent(memorySetId)}`
    );
    unwrap(response.data, 'Could not delete this memory set.');
  },
};
