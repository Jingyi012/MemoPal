export type LessonTechnique = 'number-peg' | 'palace';
export type LessonGoalType = 'spelling' | 'ordered-list' | 'facts' | 'names' | 'custom';

export interface PredefinedMemoryLessonItemDto {
  id: string;
  position: number;
  contentEn: string;
  contentZh: string;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface PredefinedMemoryLessonDto {
  id: string;
  key: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  categoryId: string;
  category: PredefinedMemoryLessonCategoryDto;
  techniqueKey: LessonTechnique;
  goalType: LessonGoalType;
  sortOrder: number;
  isPublished: boolean;
  version: number;
  items: PredefinedMemoryLessonItemDto[];
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface PredefinedMemoryLessonItemInput {
  id?: string;
  position: number;
  contentEn: string;
  contentZh: string;
}

export interface PredefinedMemoryLessonUpsertRequest {
  key: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  categoryId: string;
  techniqueKey: LessonTechnique;
  goalType: LessonGoalType;
  sortOrder: number;
  isPublished: boolean;
  expectedVersion?: number;
  items: PredefinedMemoryLessonItemInput[];
}

export interface PredefinedMemoryLessonCategoryDto {
  id: string;
  key: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  sortOrder: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface PredefinedMemoryLessonCategoryUpsertRequest {
  key: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  sortOrder: number;
  isActive: boolean;
  expectedVersion?: number;
}
