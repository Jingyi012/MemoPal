export type PalaceLocus = {
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
};

export type PalaceScene = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
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
