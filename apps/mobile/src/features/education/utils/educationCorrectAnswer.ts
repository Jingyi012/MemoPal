import type { EducationAttemptAnswerDto, EducationQuestion } from '../types/question.types';

/** Formats the answer revealed by an authorized check, never guesses from the learner's selection. */
export function educationCorrectAnswerText(question: EducationQuestion, answer: EducationAttemptAnswerDto | null | undefined,
  labels: { trueLabel: string; falseLabel: string }): string | null {
  if (!answer) return null;
  if (question.type === 'single-choice' && answer.type === question.type) return question.options.find(option => option.id === answer.optionId)?.label ?? null;
  if (question.type === 'multiple-select' && answer.type === question.type) return question.options.filter(option => answer.optionIds?.includes(option.id)).map(option => option.label).join(' · ') || null;
  if (question.type === 'true-false' && answer.type === question.type && typeof answer.booleanValue === 'boolean') return answer.booleanValue ? labels.trueLabel : labels.falseLabel;
  if (question.type === 'fill-blank') return answer.type === 'text' ? answer.textValue ?? null : answer.type === 'number' ? answer.numericValue ?? null : null;
  if (question.type === 'ordering' && answer.type === question.type) return answer.orderedOptionIds?.map(id => question.options.find(option => option.id === id)?.label).filter(Boolean).join(' → ') || null;
  if (question.type === 'matching' && answer.type === question.type) return answer.matches?.flatMap(pair => {
    const left = question.options.find(option => option.id === pair.leftOptionId)?.label;
    const right = question.matchTargets.find(target => target.id === pair.matchTargetId)?.label;
    return left && right ? [`${left} → ${right}`] : [];
  }).join('\n') || null;
  return null;
}
