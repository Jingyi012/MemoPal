import type {
  EducationAnswer,
  EducationAssessmentAttempt,
  EducationAttemptAnswerDto,
  EducationAttemptQuestion,
  FillBlankAnswer,
  SingleChoiceAnswer,
  MultipleSelectAnswer,
  OrderingAnswer,
  EducationMatchingAnswerPair,
  MatchingAnswer,
  WrittenResponseAnswer,
  TrueFalseAnswer,
  PhotoResponseAnswer,
  VoiceResponseAnswer,
} from '@/features/education/types/question.types';
import { createEmptyEducationAnswer } from '@/features/education/components/question-inputs/createEmptyEducationAnswer';
import { readPhotoResponse, toPhotoResponseDto } from './educationPhotoResponse';
import { readVoiceResponse, toVoiceResponseDto } from './educationVoiceResponse';
export { isEducationResponseBlank as isBlankResponse, isEducationResponseBlank } from './isEducationResponseBlank';

export function answerForQuestion(
  question: EducationAttemptQuestion,
  answer: EducationAttemptAnswerDto | null | undefined,
): EducationAnswer {
  if (!answer) return createEmptyEducationAnswer(question);

  if (question.type === 'single-choice' && answer.type === 'single-choice' && answer.optionId) {
    return { type: 'single-choice', optionId: answer.optionId } satisfies SingleChoiceAnswer;
  }
  if (question.type === 'multiple-select' && answer.type === 'multiple-select' && Array.isArray(answer.optionIds)) {
    return { type: 'multiple-select', optionIds: answer.optionIds } satisfies MultipleSelectAnswer;
  }
  if (question.type === 'ordering' && answer.type === 'ordering' && Array.isArray(answer.orderedOptionIds) &&
      answer.orderedOptionIds.length === question.options.length && new Set(answer.orderedOptionIds).size === question.options.length &&
      answer.orderedOptionIds.every(id => question.options.some(option => option.id === id))) {
    return { type: 'ordering', orderedOptionIds: [...answer.orderedOptionIds] } satisfies OrderingAnswer;
  }
  if (question.type === 'matching' && answer.type === 'matching' && Array.isArray(answer.matches) &&
      answer.matches.length <= question.options.length &&
      new Set(answer.matches.map(match => match.leftOptionId)).size === answer.matches.length &&
      new Set(answer.matches.map(match => match.matchTargetId)).size === answer.matches.length &&
      answer.matches.every(match => question.options.some(option => option.id === match.leftOptionId) &&
        question.matchTargets.some(target => target.id === match.matchTargetId))) {
    return { type: 'matching', matches: answer.matches.map(match => ({ ...match })) } satisfies MatchingAnswer;
  }
  if (question.type === 'written-response' && answer.type === 'written-response' &&
      typeof answer.textValue === 'string' && answer.textValue.length <= 12000) {
    return { type: 'written-response', text: answer.textValue } satisfies WrittenResponseAnswer;
  }
  if (question.type === 'photo-response' && answer.type === 'photo-response') {
    const photoAnswer = readPhotoResponse(answer);
    if (photoAnswer) return photoAnswer satisfies PhotoResponseAnswer;
  }
  if (question.type === 'voice-response' && answer.type === 'voice-response' && typeof answer.audioAttachmentId === 'string') {
    const voiceAnswer = readVoiceResponse(answer);
    if (voiceAnswer) return voiceAnswer satisfies VoiceResponseAnswer;
  }
  if (question.type === 'true-false' && answer.type === 'true-false' && typeof answer.booleanValue === 'boolean') {
    return { type: 'true-false', value: answer.booleanValue } satisfies TrueFalseAnswer;
  }
  if (question.type === 'fill-blank' && question.fillMode === 'text' && answer.type === 'text' && typeof answer.textValue === 'string') {
    return { type: 'fill-blank', text: answer.textValue } satisfies FillBlankAnswer;
  }
  if (question.type === 'fill-blank' && question.fillMode === 'number' && answer.type === 'number' && typeof answer.numericValue === 'string') {
    return { type: 'fill-blank', text: answer.numericValue } satisfies FillBlankAnswer;
  }

  throw new Error(`Saved response type does not match question ${question.id}.`);
}

export function answersForAttempt(attempt: EducationAssessmentAttempt): Record<string, EducationAnswer> {
  const responses = new Map(attempt.responses.map((response) => [response.questionId, response.answer]));
  return Object.fromEntries(attempt.questions.map((question) => [
    question.id,
    answerForQuestion(question, responses.get(question.id)),
  ]));
}

export function toAttemptAnswerDto(
  question: EducationAttemptQuestion,
  answer: EducationAnswer,
): EducationAttemptAnswerDto {
  if (question.type === 'single-choice' && answer.type === 'single-choice' && answer.optionId !== null) {
    return { type: 'single-choice', optionId: answer.optionId };
  }
  if (question.type === 'multiple-select' && answer.type === 'multiple-select') {
    return { type: 'multiple-select', optionIds: [...answer.optionIds] };
  }
  if (question.type === 'ordering' && answer.type === 'ordering') {
    return { type: 'ordering', orderedOptionIds: [...answer.orderedOptionIds] };
  }
  if (question.type === 'matching' && answer.type === 'matching') {
    return { type: 'matching', matches: answer.matches.map((match): EducationMatchingAnswerPair => ({ ...match })) };
  }
  if (question.type === 'written-response' && answer.type === 'written-response') {
    return { type: 'written-response', textValue: answer.text };
  }
  if (question.type === 'photo-response' && answer.type === 'photo-response') {
    const photoDto = toPhotoResponseDto(answer.photoAttachmentId);
    if (photoDto) return photoDto;
  }
  if (question.type === 'voice-response' && answer.type === 'voice-response' && answer.audioAttachmentId) {
    const voiceDto = toVoiceResponseDto(answer.audioAttachmentId);
    if (voiceDto) return voiceDto;
  }
  if (question.type === 'true-false' && answer.type === 'true-false' && answer.value !== null) {
    return { type: 'true-false', booleanValue: answer.value };
  }
  if (question.type === 'fill-blank' && answer.type === 'fill-blank') {
    return question.fillMode === 'number'
      ? { type: 'number', numericValue: answer.text }
      : { type: 'text', textValue: answer.text };
  }
  throw new Error(`Answer type does not match question ${question.id}.`);
}

export function isSameAnswer(left: EducationAnswer, right: EducationAnswer): boolean {
  if (left.type !== right.type) return false;
  if (left.type === 'single-choice' && right.type === 'single-choice') return left.optionId === right.optionId;
  if (left.type === 'multiple-select' && right.type === 'multiple-select') return left.optionIds.length === right.optionIds.length && left.optionIds.every((id) => right.optionIds.includes(id));
  if (left.type === 'ordering' && right.type === 'ordering') return left.orderedOptionIds.length === right.orderedOptionIds.length && left.orderedOptionIds.every((id, index) => id === right.orderedOptionIds[index]);
  if (left.type === 'matching' && right.type === 'matching') return left.matches.length === right.matches.length && left.matches.every(match => right.matches.some(other => other.leftOptionId === match.leftOptionId && other.matchTargetId === match.matchTargetId));
  if (left.type === 'true-false' && right.type === 'true-false') return left.value === right.value;
  if (left.type === 'fill-blank' && right.type === 'fill-blank') return left.text === right.text;
  if (left.type === 'written-response' && right.type === 'written-response') return left.text === right.text;
  if (left.type === 'photo-response' && right.type === 'photo-response') return left.photoAttachmentId === right.photoAttachmentId;
  if (left.type === 'voice-response' && right.type === 'voice-response') return left.audioAttachmentId === right.audioAttachmentId;
  return false;
}
