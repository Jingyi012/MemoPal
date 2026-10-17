export type AppearanceItemType = 'frame' | 'decoration' | 'outfit';

export interface AppearanceDefinition {
  id: string;
  key: string;
  itemType: AppearanceItemType;
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
