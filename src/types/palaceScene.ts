export interface PalaceLocusDto {
  id: string;
  position: number;
  name: string;
  description?: string | null;
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface PalaceSceneDto {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  isTemplate: boolean;
  isPremium: boolean;
  version: number;
  loci: PalaceLocusDto[];
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface PalaceLocusInput {
  id?: string;
  position: number;
  name: string;
  description?: string;
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
}

export interface PalaceSceneUpsertRequest {
  name: string;
  description: string;
  imageUrl: string;
  status: 'draft' | 'published' | 'archived';
  isPremium: boolean;
  expectedVersion?: number;
  loci: PalaceLocusInput[];
}
