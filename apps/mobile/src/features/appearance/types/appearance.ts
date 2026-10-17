export type AppearanceItemType = 'frame' | 'decoration' | 'outfit' | 'headwear' | 'bodywear' | 'backwear' | 'handItem';

export interface AppearanceDefinition {
  id: string;
  key: string;
  itemType: AppearanceItemType;
  companionAvatarKey?: string | null;
  setKey?: string | null;
  setTitleEn?: string | null;
  setTitleZh?: string | null;
  setStoryEn?: string | null;
  setStoryZh?: string | null;
  assetKey: string;
  imageUrl?: string | null;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  requiredLevel: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquippedAppearance {
  frame?: AppearanceDefinition;
  decoration?: AppearanceDefinition;
  outfit?: AppearanceDefinition;
}
