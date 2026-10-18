import type { EducationAnswer, EducationAttemptQuestion } from '@/features/education/types/question.types';

export function isEducationResponseBlank(question: EducationAttemptQuestion, answer: EducationAnswer): boolean {
  if (question.type === 'single-choice' && answer.type === 'single-choice') return answer.optionId === null;
  if (question.type === 'true-false' && answer.type === 'true-false') return answer.value === null;
  if (question.type === 'fill-blank' && answer.type === 'fill-blank') return answer.text.trim().length === 0;
  if (question.type === 'multiple-select' && answer.type === 'multiple-select') return answer.optionIds.length === 0;
  if (question.type === 'ordering' && answer.type === 'ordering') return answer.orderedOptionIds.length === 0;
  if (question.type === 'matching' && answer.type === 'matching') return answer.matches.length === 0;
  if (question.type === 'written-response' && answer.type === 'written-response') return answer.text.trim().length === 0;
  if (question.type === 'photo-response' && answer.type === 'photo-response') return answer.photoAttachmentId === null;
  if (question.type === 'voice-response' && answer.type === 'voice-response') return answer.audioAttachmentId === null;
  return false;
}
