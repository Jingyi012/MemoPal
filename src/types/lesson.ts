export interface Lesson {
  id: string;
  palaceId: string;
  title: string;
  description?: string;
  wordCount: number;
  category?: string; // need verify
  tag?: string; // need verify
  isCustom?: boolean;
  locked?: boolean;
  completed?: boolean;
  isPremium?: boolean;
  progress?: LessonProgress;
}

export interface LessonDetails extends Lesson {
  words: Word[];
}

export interface LessonProgress {
  lessonId: string;
  firstCompletedDate: string;
  reviewSchedule: ReviewSchedule;
  totalReviews: number;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  lastReviewDate?: string;
  xpEarned: number;
}

export interface Word {
  id: string;
  text: string;
  translation?: string;
  locationId: string;
}

export interface ReviewSchedule {
  review1: { dueDate: string; completed: boolean; completedDate?: string };
  review2: { dueDate: string; completed: boolean; completedDate?: string };
  review3: { dueDate: string; completed: boolean; completedDate?: string };
  review4: { dueDate: string; completed: boolean; completedDate?: string };
}

export interface LessonForm {
  id?: string;
  palaceId: string;
  title: string;
  description?: string;
  category?: string;
  tag?: string;
  privacy: 'private' | 'public';
  isCustom: boolean;
  words: LessonWordForm[];
}

export type LessonWordForm = Omit<Word, 'id'>;
