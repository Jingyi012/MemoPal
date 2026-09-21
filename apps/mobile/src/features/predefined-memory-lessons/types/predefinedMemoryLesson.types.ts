import type { Auditable } from '@/core/types/general';

export type LessonTechnique = 'number-peg' | 'palace';
export type LessonGoalType = 'spelling' | 'ordered-list' | 'facts' | 'names' | 'custom';

export interface PredefinedMemoryLessonItem extends Auditable {
  id: string;
  position: number;
  contentEn: string;
  contentZh: string;
  associationEn: string;
  associationZh: string;
}

export interface PredefinedMemoryLesson extends Auditable {
  id: string;
  key: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  categoryId: string;
  category: PredefinedMemoryLessonCategory;
  techniqueKey: LessonTechnique;
  goalType: LessonGoalType;
  palaceSceneId?: string | null;
  sortOrder: number;
  isPublished: boolean;
  isStarterLesson: boolean;
  version: number;
  items: PredefinedMemoryLessonItem[];
}

export interface PredefinedMemoryLessonCategory extends Auditable {
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
}
