import api from '@/core/api/apiClient';
import type { GeneralResponse, PagedResponse } from '@/core/types/general';
import type {
  CommunityMemorySetDetail,
  CommunityMemorySetFilters,
  CommunityMemorySetPage,
  CommunityMemorySetReport,
  CommunityMemorySetSummary,
} from '../types/communityMemorySet.types';

function unwrap<T>(response: GeneralResponse<T>, fallbackMessage: string): T {
  if (!response.success || response.data == null) {
    throw new Error(response.message ?? fallbackMessage);
  }
  return response.data;
}

export const communityMemorySetApi = {
  async discover(filters: CommunityMemorySetFilters, pageNumber = 1, pageSize = 12): Promise<CommunityMemorySetPage> {
    const response = await api.get<PagedResponse<CommunityMemorySetSummary[]>>('/v2/community/memory-sets', {
      params: {
        pageNumber,
        pageSize,
        search: filters.search || undefined,
        techniqueKey: filters.techniqueKey,
        goalType: filters.goalType,
        sort: filters.sort,
      },
    });
    const data = unwrap(response.data, 'Could not load community memories.');
    return {
      items: data,
      pageNumber: response.data.pagination?.pageNumber ?? pageNumber,
      pageSize: response.data.pagination?.pageSize ?? pageSize,
      totalCount: response.data.pagination?.totalCount ?? data.length,
    };
  },

  async getPublicById(memorySetId: string): Promise<CommunityMemorySetDetail> {
    const response = await api.get<GeneralResponse<CommunityMemorySetDetail>>(
      `/v2/community/memory-sets/${encodeURIComponent(memorySetId)}`,
    );
    return unwrap(response.data, 'Could not load this community memory.');
  },

  async copy(memorySetId: string): Promise<{ memorySet: import('../types/memorySet.types').MemorySet; alreadyCopied: boolean }> {
    const response = await api.post<GeneralResponse<{ memorySet: import('../types/memorySet.types').MemorySet; alreadyCopied: boolean }>>(
      `/v2/community/memory-sets/${encodeURIComponent(memorySetId)}/copy`,
    );
    return unwrap(response.data, 'Could not copy this community memory.');
  },

  async report(memorySetId: string, reason: string, details?: string): Promise<void> {
    const response = await api.post<GeneralResponse<CommunityMemorySetReport>>(
      `/v2/community/memory-sets/${encodeURIComponent(memorySetId)}/reports`,
      { reason, details },
    );
    unwrap(response.data, 'Could not send this report.');
  },
};
