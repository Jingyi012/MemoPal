import { Auditable, SoftDeletable, Syncable } from './general';

export type LessonCategory =
  | 'language-learning'
  | 'vocabulary'
  | 'medical'
  | 'science'
  | 'history'
  | 'business'
  | 'test-prep'
  | 'general';

export interface Lesson extends Auditable, Syncable, SoftDeletable {
  id: string;
  palaceId: string;
  title: string;
  description?: string | null;
  wordCount: number;
  category?: LessonCategory | null;
  tag?: string[];
  isCustom?: boolean | null;
  isLocked?: boolean | null;
  completed?: boolean | null;
  isPremium?: boolean | null;
  privacy: 'private' | 'public';
  progress?: LessonProgress | null;
  createdBy?: string | null;
}

export interface LessonDetails extends Lesson {
  words: Word[];
}

export interface LessonProgress extends Auditable, Syncable, SoftDeletable {
  id: string;
  lessonId: string;
  firstCompletedDate?: string | null;
  reviewSchedules: ReviewSchedule[];
  totalReviews: number;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  lastReviewDate?: string | null;
  xpEarned: number;
}

export interface Word extends Auditable, Syncable, SoftDeletable {
  id: string;
  lessonId: string;
  text: string;
  meaning?: string;
  locationId: string;
}

export interface ReviewSchedule extends Auditable, Syncable, SoftDeletable {
  id: string;
  lessonProgressId: string;
  reviewRound: number;
  dueDate: string;
  completed: boolean;
  completedDate?: string | null;
}

export interface LessonForm {
  id?: string;
  palaceId: string;
  title: string;
  description?: string;
  category?: LessonCategory;
  tag?: string[];
  privacy: 'private' | 'public';
  isCustom: boolean;
  words: LessonWordForm[];
}

export type LessonWordForm = {
  text: string;
  meaning?: string;
  locationId: string;
};
