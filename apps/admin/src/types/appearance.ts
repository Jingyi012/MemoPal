export type AppearanceItemType = 'frame' | 'decoration' | 'outfit' | 'headwear' | 'bodywear' | 'backwear' | 'handItem';

export interface AppearanceDefinitionDto {
  id: string;
  key: string;
  itemType: AppearanceItemType;
  assetKey: string;
  imageUrl?: string | null;
  companionAvatarKey?: string | null;
  setKey?: string | null;
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
