import type {
  EducationAnswer,
  EducationQuestion,
  FillBlankAnswer,
  FillBlankQuestion,
  SingleChoiceAnswer,
  SingleChoiceQuestion,
  MultipleSelectQuestion,
  MultipleSelectAnswer,
  OrderingQuestion,
  OrderingAnswer,
  MatchingQuestion,
  MatchingAnswer,
  TrueFalseAnswer,
  TrueFalseQuestion,
  WrittenResponseQuestion,
  WrittenResponseAnswer,
  PhotoResponseQuestion,
  PhotoResponseAnswer,
  VoiceResponseQuestion,
  VoiceResponseAnswer,
} from '@/features/education/types/question.types';

export function createEmptyEducationAnswer(question: SingleChoiceQuestion): SingleChoiceAnswer;
export function createEmptyEducationAnswer(question: MultipleSelectQuestion): MultipleSelectAnswer;
export function createEmptyEducationAnswer(question: OrderingQuestion): OrderingAnswer;
export function createEmptyEducationAnswer(question: MatchingQuestion): MatchingAnswer;
export function createEmptyEducationAnswer(question: TrueFalseQuestion): TrueFalseAnswer;
export function createEmptyEducationAnswer(question: FillBlankQuestion): FillBlankAnswer;
export function createEmptyEducationAnswer(question: WrittenResponseQuestion): WrittenResponseAnswer;
export function createEmptyEducationAnswer(question: PhotoResponseQuestion): PhotoResponseAnswer;
export function createEmptyEducationAnswer(question: VoiceResponseQuestion): VoiceResponseAnswer;
export function createEmptyEducationAnswer(question: EducationQuestion): EducationAnswer;
export function createEmptyEducationAnswer(question: EducationQuestion): EducationAnswer {
  switch (question.type) {
    case 'single-choice':
      return { type: 'single-choice', optionId: null };
    case 'multiple-select':
      return { type: 'multiple-select', optionIds: [] };
    case 'ordering':
      return { type: 'ordering', orderedOptionIds: [] };
    case 'matching':
      return { type: 'matching', matches: [] };
    case 'true-false':
      return { type: 'true-false', value: null };
    case 'fill-blank':
      return { type: 'fill-blank', text: '' };
    case 'written-response':
      return { type: 'written-response', text: '' };
    case 'photo-response':
      return { type: 'photo-response', photoAttachmentId: null };
    case 'voice-response':
      return { type: 'voice-response', audioAttachmentId: null };
  }
}
