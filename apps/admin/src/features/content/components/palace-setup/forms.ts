import type {
  LessonDto,
  LessonUpsertRequest,
  LocationUpsertRequest,
  PalaceDto,
  PalaceUpsertRequest,
} from '../../../../types/content';

export type PalaceFormValues = {
  name: string;
  description: string;
  thumbnail: string;
  level: number;
  isPremium: boolean;
  isCustom: boolean;
  isLocked: boolean;
};

export type LocationFormValues = {
  position?: number;
  name: string;
  description: string;
  imageUrl: string;
};

export type LessonFormValues = {
  title: string;
  description?: string;
  category?: string;
  privacy: string;
  isPremium: boolean;
  isCustom: boolean;
  isLocked: boolean;
};

export function buildPalacePayload(
  values: PalaceFormValues,
  existing?: PalaceDto
): PalaceUpsertRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    thumbnail: values.thumbnail,
    level: values.level,
    isPremium: values.isPremium,
    isCustom: values.isCustom,
    isLocked: values.isLocked,
    locationsCount: existing?.locationsCount ?? 0,
    unlockedAt: existing?.unlockedAt ?? null,
    createdBy: existing?.createdBy ?? null,
  };
}

export function buildLocationPayload(
  palaceId: string,
  values: LocationFormValues,
  fallbackPosition?: number
): LocationUpsertRequest {
  const resolvedPosition = values.position ?? fallbackPosition ?? 1;

  return {
    palaceId,
    position: resolvedPosition,
    name: values.name,
    description: values.description,
    imageUrl: values.imageUrl,
  };
}

export function buildLessonPayload(
  palaceId: string,
  values: LessonFormValues,
  existing?: LessonDto
): LessonUpsertRequest {
  return {
    palaceId,
    title: values.title.trim(),
    description: values.description?.trim() || null,
    category: values.category?.trim() || null,
    privacy: values.privacy,
    isPremium: values.isPremium,
    isCustom: values.isCustom,
    isLocked: values.isLocked,
    wordCount: existing?.wordCount ?? 0,
    completed: existing?.completed ?? false,
    createdBy: existing?.createdBy ?? null,
    tag: existing?.tag ?? null,
  };
}
