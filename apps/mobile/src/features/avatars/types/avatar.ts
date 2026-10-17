export interface AvatarDefinition {
  id: string;
  key: string;
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
