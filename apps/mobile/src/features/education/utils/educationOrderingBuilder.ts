import type { OrderingAnswer, OrderingQuestion } from '@/features/education/types/question.types';

export function addEducationOrderingOption(selectedIds: readonly string[], optionId: string, allowedIds: readonly string[]): string[] {
  if (!allowedIds.includes(optionId) || selectedIds.includes(optionId)) return [...selectedIds];
  return [...selectedIds, optionId];
}

export function removeEducationOrderingOption(selectedIds: readonly string[], optionId: string): string[] {
  return selectedIds.filter(id => id !== optionId);
}

export function isEducationOrderingAnswerComplete(question: OrderingQuestion, answer: OrderingAnswer): boolean {
  const allowedIds = question.options.map(option => option.id);
  return answer.orderedOptionIds.length === allowedIds.length &&
    new Set(answer.orderedOptionIds).size === allowedIds.length &&
    answer.orderedOptionIds.every(id => allowedIds.includes(id));
}
