export type MemoryTechniqueKey = 'palace' | 'number-peg';
export type MemoryGoalType = 'spelling' | 'ordered-list' | 'facts' | 'names' | 'custom';
export type MemorySetStatus = 'draft' | 'ready' | 'active' | 'archived';
export type MemorySetVisibility = 'private' | 'unlisted' | 'public';

export type MemoryItem = {
  id: string;
  position: number;
  prompt: string;
  answer: string;
  hint?: string | null;
  pronunciationAudioUrl?: string | null;
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
};

export type PegBinding = {
  id: string;
  memoryItemId: string;
  pegNumber: number;
  sceneText: string;
  sceneRecipe?: PegSceneRecipe | null;
  isCustomScene: boolean;
  sceneAssetUrl?: string | null;
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
};

export type PalaceBinding = {
  id: string;
  memoryItemId: string;
  locusId: string;
  associationText: string;
  isCustomScene: boolean;
  sceneAssetUrl?: string | null;
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
};

export type TechniquePlan = {
  id: string;
  techniqueKey: MemoryTechniqueKey;
  schemaVersion: number;
  palaceSceneId?: string | null;
  pegBindings: PegBinding[];
  palaceBindings: PalaceBinding[];
  createdAt?: string;
  createdBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
};

export type MemorySet = {
  id: string;
  title: string;
  description?: string | null;
  goalType: MemoryGoalType;
  techniqueKey: MemoryTechniqueKey;
  status: MemorySetStatus;
  visibility: MemorySetVisibility;
  version: number;
  items: MemoryItem[];
  techniquePlan?: TechniquePlan | null;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
};

export type MemoryItemInput = {
  position: number;
  prompt: string;
  answer: string;
  hint?: string | null;
  pronunciationAudioUrl?: string | null;
};

export type PegBindingInput = {
  itemPosition: number;
  pegNumber: number;
  sceneText: string;
  sceneRecipe?: PegSceneRecipe | null;
  isCustomScene: boolean;
  sceneAssetUrl?: string | null;
};

export type PegSceneRecipe = {
  schemaVersion: 1;
  associationSource: 'suggested' | 'customized' | 'user-written';
  caption: string;
  actionPreset: 'crash' | 'bounce' | 'wrap' | 'explode' | 'melt' | 'chase' | 'swallow' | 'stretch' | 'spin' | 'launch';
  visualEffectPreset?: string | null;
  soundPreset?: 'complete' | 'correct' | 'wrong' | null;
  hapticPreset?: 'impact' | 'success' | null;
  sensoryBoosters: string[];
  targetVisual?: { kind: 'emoji' | 'sticker' | 'word'; value: string } | null;
  anchorSnapshot?: {
    pegNumber: number;
    catalogueVersion: string;
    keyword: string;
    image: string;
    description: string;
  } | null;
};

export type PalaceBindingInput = {
  itemPosition: number;
  locusId: string;
  associationText: string;
  isCustomScene: boolean;
  sceneAssetUrl?: string | null;
};

export type MemorySetUpsertRequest = {
  title: string;
  description?: string | null;
  goalType: MemoryGoalType;
  techniqueKey: MemoryTechniqueKey;
  status: MemorySetStatus;
  visibility: MemorySetVisibility;
  expectedVersion?: number;
  items: MemoryItemInput[];
  techniquePlan?: {
    schemaVersion: number;
    palaceSceneId?: string | null;
    pegBindings: PegBindingInput[];
    palaceBindings: PalaceBindingInput[];
  } | null;
};
