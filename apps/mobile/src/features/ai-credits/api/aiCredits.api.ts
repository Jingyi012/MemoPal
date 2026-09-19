import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type AiCreditPurchasePack = {
  key: string; credits: number; price: number; label: string; badge: string | null;
};
export type AiCreditPurchaseConfig = {
  currencyCode: string; currencySymbol: string; customPurchaseEnabled: boolean;
  customMinCredits: number; customMaxCredits: number; customStep: number; pricePerCredit: number;
  packs: AiCreditPurchasePack[];
};
export type AiCreditBalance = {
  available: number; subscription: number; purchased: number; nextExpiry: string | null;
  textCost: number; imageCost: number; imagesEnabled: boolean; purchasesEnabled: boolean; imagesConfigured: boolean;
  purchaseConfig: AiCreditPurchaseConfig;
};
export type AiCreditEntry = { id: string; kind: string; amount: number; createdAt: string };
export type AiGeneration = {
  id: string; kind: string; status: string; reserved: number; charged: number;
  resultJson: string | null; createdAt: string;
};
export type NumberPegImageInput = { pegNumber: number; pegKeyword: string; word: string; story: string };
export type ImageReservation = { id: string; status: string; resultJson: string | null; unitCost: number };

async function get<T>(path: string): Promise<T> {
  const { data } = await api.get<GeneralResponse<T>>(path);
  if (!data.success) throw new Error(data.message || 'Could not load AI credits.');
  return data.data;
}

export const aiCreditsApi = {
  balance: () => get<AiCreditBalance>('/v1/ai-credits'),
  history: (skip = 0) => get<AiCreditEntry[]>(`/v1/ai-credits/history?skip=${skip}`),
  generations: () => get<AiGeneration[]>('/v1/ai-credits/generations'),
  async image(path: string) {
    if (!/^\/v1\/ai-credits\/images\/[a-f0-9]{32}$/.test(path)) throw new Error('Invalid generated image.');
    return get<string>(`${path}/data`);
  },
  async generateImage(requestId: string, input: NumberPegImageInput, maxCredits: number): Promise<ImageReservation> {
    const { data } = await api.post<GeneralResponse<ImageReservation>>('/v1/ai-credits/number-peg-images', { requestId, input, maxCredits });
    if (!data.success) throw new Error(data.message || 'Could not start image generation.');
    return data.data;
  },
};
