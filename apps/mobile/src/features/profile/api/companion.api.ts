import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';

export type CompanionMemory = {
  id: string;
  type: string;
  occurredAt: string;
  summaryEn: string;
  summaryZh: string;
};

export type CompanionLook = {
  headwearId: string | null;
  bodywearId: string | null;
  backwearId: string | null;
  handItemId: string | null;
};

export type CompanionBondStage = { key: string; points: number; titleEn: string; titleZh: string };

export type CompanionStatus = {
  avatarId: string | null;
  bondPoints: number;
  bondStage: string;
  bondProgress: number;
  bondToNextStage: number;
  todayPracticeCount: number;
  memories: CompanionMemory[];
  look: CompanionLook;
  bondStages: CompanionBondStage[];
};

export type SaveCompanionLookInput = CompanionLook & { avatarId: string };

export type CompanionPreset = {
  id: string;
  avatarId: string;
  name: string;
  look: CompanionLook;
  createdAt: string;
};

export type CreateCompanionPresetInput = {
  avatarId: string;
  name: string;
  look: CompanionLook;
};

export const companionApi = {
  async getStatus(): Promise<CompanionStatus> {
    const response = await api.get<GeneralResponse<CompanionStatus>>('/companion');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async greet(): Promise<CompanionStatus> {
    const response = await api.post<GeneralResponse<CompanionStatus>>('/companion/greet');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async select(avatarId: string): Promise<CompanionStatus> {
    const response = await api.put<GeneralResponse<CompanionStatus>>('/companion/selection', { avatarId });
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async saveLook(input: SaveCompanionLookInput): Promise<CompanionStatus> {
    const response = await api.put<GeneralResponse<CompanionStatus>>('/companion/look', input);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async getPresets(): Promise<CompanionPreset[]> {
    const response = await api.get<GeneralResponse<CompanionPreset[]>>('/companion/presets');
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async createPreset(input: CreateCompanionPresetInput): Promise<CompanionPreset> {
    const response = await api.post<GeneralResponse<CompanionPreset>>('/companion/presets', input);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async equipPreset(id: string): Promise<CompanionStatus> {
    const response = await api.put<GeneralResponse<CompanionStatus>>(`/companion/presets/${encodeURIComponent(id)}/equip`);
    if (!response.data.success) throw new Error(response.data.message);
    return response.data.data;
  },
  async deletePreset(id: string): Promise<void> {
    const response = await api.delete<GeneralResponse<unknown>>(`/companion/presets/${encodeURIComponent(id)}`);
    if (!response.data.success) throw new Error(response.data.message);
  },
};
