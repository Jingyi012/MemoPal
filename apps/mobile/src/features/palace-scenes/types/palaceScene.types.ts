export type PalaceLocus = {
  id: string;
  position: number;
  name: string;
  description?: string | null;
  nameEn?: string | null;
  nameZh?: string | null;
  descriptionEn?: string | null;
  descriptionZh?: string | null;
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
};

export type PalaceScene = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  /** Optional bundled source used only by local preview fixtures. */
  imageSource?: number;
  status: 'draft' | 'published' | 'archived';
  isTemplate: boolean;
  isPremium: boolean;
  version: number;
  loci: PalaceLocus[];
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
};

export type PalaceLocusInput = {
  id?: string;
  position: number;
  name: string;
  description?: string;
  nameEn?: string;
  nameZh?: string;
  descriptionEn?: string;
  descriptionZh?: string;
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
};

export type PalaceSceneUpsertRequest = {
  name: string;
  description: string;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  isPremium: boolean;
  expectedVersion?: number;
  loci: PalaceLocusInput[];
};
