import type { MemoryGoalType, MemoryTechniqueKey, PegSceneRecipe } from './memorySet.types';

export type CommunityMemorySetOwner = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
};

/** Public DTOs intentionally carry no private practice answers or audit data. */
export type CommunityMemorySetSummary = {
  id: string;
  title: string;
  description?: string | null;
  goalType: MemoryGoalType;
  techniqueKey: MemoryTechniqueKey;
  itemCount: number;
  author: CommunityMemorySetOwner;
  publishedAt: string;
  copyCount: number;
  existingCopyId?: string | null;
  coverImageUrl?: string | null;
};

export type CommunityMemorySetDetail = CommunityMemorySetSummary & {
  items: CommunityMemoryItem[];
  techniquePlan?: CommunityTechniquePlan | null;
};

export type CommunityMemoryItem = {
  id: string;
  position: number;
  prompt: string;
  answer: string;
  hint?: string | null;
  pronunciationAudioUrl?: string | null;
};

export type CommunityTechniquePlan = {
  techniqueKey: MemoryTechniqueKey;
  schemaVersion: number;
  palaceSceneId?: string | null;
  pegBindings: { memoryItemId: string; pegNumber: number; sceneText: string; sceneRecipe?: PegSceneRecipe | null }[];
  palaceBindings: { memoryItemId: string; locusId: string; associationText: string }[];
};

export type CommunityMemorySetSort = 'newest' | 'popular';

export type CommunityMemorySetFilters = {
  search?: string;
  techniqueKey?: MemoryTechniqueKey;
  goalType?: MemoryGoalType;
  sort?: CommunityMemorySetSort;
};

export type CommunityMemorySetPage = {
  items: CommunityMemorySetSummary[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
};

export type CommunityMemorySetReport = {
  id: string;
  memorySetId: string;
  reason: string;
  createdAt: string;
};
