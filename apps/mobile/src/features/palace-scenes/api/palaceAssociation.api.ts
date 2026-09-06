import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type PalaceAssociationGenerationItem = {
  position: number;
  word: string;
  locusName: string;
  locusDescription?: string | null;
};

export type GeneratePalaceAssociationsRequest = {
  locale: 'en' | 'zh';
  style?: 'playful' | 'vivid';
  chainMode?: boolean;
  items: PalaceAssociationGenerationItem[];
};

export type PalaceAssociationSuggestion = {
  position: number;
  associationText: string;
  action: string;
  sensoryDetail: string;
};

export type GeneratePalaceAssociationsResponse = {
  suggestions: PalaceAssociationSuggestion[];
  requestedCount: number;
  generatedCount: number;
  source: 'ai' | 'template' | 'mixed' | string;
};

export const palaceAssociationApi = {
  async generate(
    request: GeneratePalaceAssociationsRequest,
  ): Promise<GeneratePalaceAssociationsResponse> {
    const response = await api.post<GeneralResponse<GeneratePalaceAssociationsResponse>>(
      '/v1/palace-associations/generate',
      request,
      { timeout: 90_000 },
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message ?? 'Could not generate Palace associations.');
    }
    return response.data.data;
  },
};
