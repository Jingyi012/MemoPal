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
  description?: string;
  wordCount: number;
  category?: LessonCategory;
  tag?: string[];
  isCustom?: boolean;
  isLocked?: boolean;
  completed?: boolean;
  isPremium?: boolean;
  privacy: 'private' | 'public';
  progress?: LessonProgress;
}

export interface LessonDetails extends Lesson {
  words: Word[];
}

export interface LessonProgress extends Auditable, Syncable, SoftDeletable {
  id: string;
  userId: string;
  lessonId: string;
  firstCompletedDate: string;
  reviewSchedule: ReviewSchedule[];
  totalReviews: number;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  lastReviewDate?: string;
  xpEarned: number;
}

export interface Word extends Auditable, Syncable, SoftDeletable {
  id: string;
  lessonId: string;
  text: string;
  meaning?: string;
  locationId: string;
}

export interface ReviewSchedule extends Auditable, Syncable {
  id: string;
  lessonId: string;
  reviewRound: number;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
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
