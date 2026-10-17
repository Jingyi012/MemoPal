export interface AvatarDefinitionDto {
  id: string;
  key: string;
  assetKey?: string;
  imageUrl?: string | null;
  companionCharacterImageUrl?: string | null;
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

export type AvatarDefinitionUpsertRequest = Omit<AvatarDefinitionDto, 'id' | 'createdAt' | 'updatedAt'>;
