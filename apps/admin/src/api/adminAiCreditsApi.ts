import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type { AiCreditBalance, AiCreditEntry, GrantAiCreditsRequest } from '../types/aiCredits';

export const adminAiCreditsApi = {
  async balance(userId: string) {
    return (await apiClient.get<ApiResponse<AiCreditBalance>>(`/v1/ai-credits/users/${encodeURIComponent(userId)}`)).data.data;
  },
  async history(userId: string, skip: number) {
    return (await apiClient.get<ApiResponse<AiCreditEntry[]>>(`/v1/ai-credits/users/${encodeURIComponent(userId)}/history`, { params: { skip } })).data.data;
  },
  async grant(userId: string, request: GrantAiCreditsRequest) {
    return (await apiClient.post<ApiResponse<AiCreditBalance>>(`/v1/ai-credits/users/${encodeURIComponent(userId)}/grants`, request)).data.data;
  },
};
