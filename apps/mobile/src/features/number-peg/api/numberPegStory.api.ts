import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type NumberPegStoryItem = {
  position: number;
  pegNumber: number;
  pegKeyword: string;
  word: string;
  userDetail?: string | null;
  existingStory?: string | null;
};
export type GenerateNumberPegStoriesRequest = {
  locale: 'en' | 'zh';
  style?: 'playful' | 'vivid';
  items: NumberPegStoryItem[];
};
export type NumberPegStorySuggestion = {
  position: number;
  story: string;
  creativeQuestion?: string | null;
};
export type GenerateNumberPegStoriesResponse = {
  suggestions: NumberPegStorySuggestion[];
  requestedCount: number;
  generatedCount: number;
  source: 'ai' | 'template' | 'mixed' | string;
};

export const numberPegStoryApi = {
  async generate(
    request: GenerateNumberPegStoriesRequest,
    signal?: AbortSignal
  ): Promise<GenerateNumberPegStoriesResponse> {
    const response = await api.post<GeneralResponse<GenerateNumberPegStoriesResponse>>(
      '/v1/number-peg-stories/generate',
      request,
      { timeout: 90_000, signal }
    );
    if (!response.data.success || !response.data.data)
      throw new Error(response.data.message ?? 'Could not create number peg stories.');
    return response.data.data;
  },
};
