export interface PalaceDto {
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
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface PalaceUpsertRequest {
  id?: string;
  name: string;
  description: string;
  locationsCount: number;
  thumbnail: string;
  isLocked: boolean;
  unlockedAt?: string | null;
  level: number;
  isPremium: boolean;
  isCustom: boolean;
  createdBy?: string | null;
}

export interface LocationDto {
  id: string;
  palaceId: string;
  position: number;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface LocationUpsertRequest {
  id?: string;
  palaceId: string;
  position: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface LocationReorderRequest {
  locationIds: string[];
}

export interface LessonDto {
  id: string;
  palaceId: string;
  title: string;
  description?: string | null;
  wordCount: number;
  category?: string | null;
  tag?: string[] | null;
  isCustom?: boolean | null;
  isLocked?: boolean | null;
  completed?: boolean | null;
  isPremium?: boolean | null;
  privacy: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface LessonUpsertRequest {
  id?: string;
  palaceId: string;
  title: string;
  description?: string | null;
  wordCount: number;
  category?: string | null;
  tag?: string[] | null;
  isCustom?: boolean | null;
  isLocked?: boolean | null;
  completed?: boolean | null;
  isPremium?: boolean | null;
  privacy: string;
  createdBy?: string | null;
}

export interface WordDto {
  id: string;
  lessonId: string;
  locationId: string;
  text: string;
  meaning?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
}

export interface WordUpsertRequest {
  id?: string;
  lessonId?: string;
  locationId?: string;
  text?: string;
  meaning?: string | null;
}
