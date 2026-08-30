import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type GamificationRules = {
  memoryLearnedXp: number;
  dueReviewXp: number;
  extraPracticeXp: number;
  extraPracticeDailyLimit: number;
  xpPerLevel: number;
};

export async function getGamificationRules(): Promise<GamificationRules> {
  const response = await api.get<GeneralResponse<GamificationRules>>('/system-settings/gamification-rules');
  if (!response.data.success) throw new Error(response.data.message);
  return response.data.data;
}
