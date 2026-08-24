import type { Auditable } from '@/core/types/general';

export type PracticeResponseInput = {
  memoryItemId: string;
  isCorrect: boolean;
  attemptCount: number;
  responseMs: number;
};

export type PracticeAttemptInput = {
  clientAttemptId: string;
  memorySetId: string;
  mode: 'recall' | 'rehearsal';
  startedAt: string;
  durationMs: number;
  responses: PracticeResponseInput[];
};

export type PracticeResponse = Auditable & PracticeResponseInput & { id: string };

export type PracticeAttempt = Auditable & {
  id: string;
  clientAttemptId: string;
  memorySetId: string;
  techniqueKey: 'palace' | 'number-peg';
  mode: 'recall' | 'rehearsal';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  correctCount: number;
  firstAttemptCorrectCount: number;
  totalCount: number;
  nextReviewAt?: string | null;
  responses: PracticeResponse[];
};

export type DueMemoryReview = Auditable & {
  id: string;
  memorySetId: string;
  memorySetTitle: string;
  techniqueKey: 'palace' | 'number-peg';
  memoryItemId: string;
  itemPosition: number;
  prompt: string;
  dueAt: string;
  intervalDays: number;
  reviewCount: number;
  lastResultCorrect: boolean;
};
