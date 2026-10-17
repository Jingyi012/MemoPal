export type AppearanceItemType = 'frame' | 'decoration' | 'outfit' | 'headwear' | 'bodywear' | 'backwear' | 'handItem';

export interface AppearanceDefinitionDto {
  id: string;
  key: string;
  itemType: AppearanceItemType;
  assetKey: string;
  imageUrl?: string | null;
  companionAvatarKeys?: string[] | null;
  offsetXPercent: number;
  offsetYPercent: number;
  scalePercent: number;
  layerOrder: number;
  setKey?: string | null;
  setTitleEn?: string | null;
  setTitleZh?: string | null;
  setStoryEn?: string | null;
  setStoryZh?: string | null;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  requiredLevel: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppearanceDefinitionUpsertRequest = Omit<AppearanceDefinitionDto, 'id' | 'createdAt' | 'updatedAt'>;
