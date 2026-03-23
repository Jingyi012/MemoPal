import { Auditable, SoftDeletable, Syncable } from './general';

export interface Location extends Auditable, Syncable, SoftDeletable {
  id: string;
  palaceId: string;
  position: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface CustomPalaceData {
  name: string;
  description: string;
  thumbnail: string;
  locations: Location[];
}

export interface Palace extends Auditable, Syncable, SoftDeletable {
  id: string;
  name: string;
  description: string;
  locationsCount: number;
  thumbnail: string;
  isLocked: boolean;
  unlockedAt?: string | null;
  level: number;
  isPremium: boolean;
  isCustom: boolean;
  createdBy?: string;
}

export interface PalaceDetails extends Palace {
  locations: Location[];
}
