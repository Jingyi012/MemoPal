import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import { Platform } from 'react-native';
import type {
  EducationAssessmentAttempt,
  EducationAttemptAnswerDto,
  EducationAttemptQuestion,
  EducationAttemptSaveResult,
  EducationAttemptStatus,
  EducationAttemptSubmitResult,
  EducationPracticeCheckResult,
  EducationQuestionOption,
  EducationResponseAttachmentFile,
  SaveEducationAttemptResponseRequest,
} from '@/features/education/types/question.types';

export type EducationAttemptQuestionDto = Readonly<{
  id: string;
  prompt: string;
  explanation: string | null;
  type: string;
  fillMode: string | null;
  maxScore: number;
  objectiveId: string;
  options: readonly EducationQuestionOption[];
  matchTargets: readonly EducationQuestionOption[];
  position: number;
}>;

type EducationAttemptDto = Readonly<{
  id: string;
  assignmentId: string;
  status: string;
  version: number;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  resultPublished: boolean;
  resultsPublishedAt: string | null;
  score: number | null;
  maxScore: number | null;
  questions: readonly EducationAttemptQuestionDto[];
  responses: EducationAssessmentAttempt['responses'];
  manualGradingPending: boolean;
}>;

type EducationAttemptSaveDto = Readonly<{
  attemptId: string;
  version: number;
  status: string;
}>;

type EducationAttemptSubmitDto = Readonly<{
  attemptId: string;
  status: string;
  submittedAt: string | null;
  resultPublished: boolean;
  resultsPublishedAt: string | null;
  score: number | null;
  maxScore: number | null;
  manualGradingPending: boolean;
}>;

function readData<T>(response: GeneralResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) {
    throw new Error(response.message ?? fallback);
  }
  return response.data;
}

function readStatus(status: string): EducationAttemptStatus {
  if (status === 'in-progress' || status === 'submitted') return status;
  throw new Error('The server returned an unsupported assignment attempt status.');
}

export function readEducationAttemptQuestion(question: EducationAttemptQuestionDto): EducationAttemptQuestion {
  const common = {
    id: question.id,
    prompt: question.prompt,
    explanation: question.explanation,
    objectiveId: question.objectiveId,
    position: question.position,
  };

  switch (question.type) {
    case 'single-choice':
      return { ...common, type: 'single-choice', options: question.options };
    case 'multiple-select':
      return { ...common, type: 'multiple-select', options: question.options };
    case 'ordering':
      return { ...common, type: 'ordering', options: question.options };
    case 'matching':
      return { ...common, type: 'matching', options: question.options, matchTargets: question.matchTargets };
    case 'true-false':
      return { ...common, type: 'true-false' };
    case 'fill-blank':
      if (question.fillMode === 'text' || question.fillMode === 'number') {
        return { ...common, type: 'fill-blank', fillMode: question.fillMode };
      }
      throw new Error('The server returned an unsupported fill-in answer mode.');
    case 'written-response':
      return { ...common, type: 'written-response' };
    case 'photo-response':
      return { ...common, type: 'photo-response' };
    case 'voice-response':
      return { ...common, type: 'voice-response' };
    default:
      throw new Error('The server returned an unsupported assignment question type.');
  }
}

function readAttempt(dto: EducationAttemptDto): EducationAssessmentAttempt {
  return {
    ...dto,
    status: readStatus(dto.status),
    questions: [...dto.questions].sort((left, right) => left.position - right.position).map(readEducationAttemptQuestion),
    responses: dto.responses.map((response) => ({
      questionId: response.questionId,
      answer: response.answer ? readAnswerDto(response.answer) : null,
      score: dto.resultPublished ? response.score ?? null : null,
      feedback: dto.resultPublished ? response.feedback ?? null : null,
    })),
  };
}

function readAnswerDto(dto: EducationAttemptAnswerDto): EducationAttemptAnswerDto {
  switch (dto.type) {
    case 'single-choice':
      if (typeof dto.optionId === 'string') return { type: dto.type, optionId: dto.optionId };
      break;
    case 'multiple-select':
      if (Array.isArray(dto.optionIds) && dto.optionIds.every((id) => typeof id === 'string')) return { type: dto.type, optionIds: dto.optionIds };
      break;
    case 'ordering':
      if (Array.isArray(dto.orderedOptionIds) && dto.orderedOptionIds.every((id) => typeof id === 'string')) return { type: dto.type, orderedOptionIds: dto.orderedOptionIds };
      break;
    case 'matching':
      if (Array.isArray(dto.matches) && dto.matches.every(match => typeof match.leftOptionId === 'string' && typeof match.matchTargetId === 'string')) return { type: dto.type, matches: dto.matches };
      break;
    case 'true-false':
      if (typeof dto.booleanValue === 'boolean') return { type: dto.type, booleanValue: dto.booleanValue };
      break;
    case 'text':
      if (typeof dto.textValue === 'string') return { type: dto.type, textValue: dto.textValue };
      break;
    case 'number':
      if (typeof dto.numericValue === 'string') return { type: dto.type, numericValue: dto.numericValue };
      break;
    case 'written-response':
      if (typeof dto.textValue === 'string') return { type: dto.type, textValue: dto.textValue };
      break;
    case 'photo-response':
      if (typeof dto.photoAttachmentId === 'string') return { type: dto.type, photoAttachmentId: dto.photoAttachmentId };
      break;
    case 'voice-response':
      if (typeof dto.audioAttachmentId === 'string') return { type: dto.type, audioAttachmentId: dto.audioAttachmentId };
      break;
  }
  throw new Error('The server returned a response that does not match its answer type.');
}

function readSave(dto: EducationAttemptSaveDto): EducationAttemptSaveResult {
  return { ...dto, status: readStatus(dto.status) };
}

function readSubmit(dto: EducationAttemptSubmitDto): EducationAttemptSubmitResult {
  return {
    ...dto,
    status: readStatus(dto.status),
    score: dto.resultPublished ? dto.score : null,
    maxScore: dto.resultPublished ? dto.maxScore : null,
  };
}

export const educationAttemptApi = {
  async getResponseAudio(attemptId: string, questionId: string, attachmentId: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
    const response = await api.get<ArrayBuffer>(
      `/v1/education/attempts/${encodeURIComponent(attemptId)}/responses/${encodeURIComponent(questionId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { responseType: 'arraybuffer' },
    );
    const contentType = response.headers['content-type'];
    return {
      bytes: new Uint8Array(response.data),
      mimeType: typeof contentType === 'string' ? contentType.split(';')[0].trim() : 'application/octet-stream',
    };
  },

  async uploadAttachment(attemptId: string, questionId: string, expectedVersion: number,
    file: EducationResponseAttachmentFile, kind: 'photo' | 'audio'): Promise<EducationAttemptSaveResult & { attachmentId: string }> {
    const form = new FormData();
    form.append('expectedVersion', String(expectedVersion));
    if (Platform.OS === 'web') {
      const localResponse = await fetch(file.uri);
      if (!localResponse.ok) throw new Error('Could not read the local recording.');
      form.append('file', await localResponse.blob(), file.name);
    } else {
      form.append('file', { uri: file.uri, name: file.name, type: file.type } as never);
    }
    const response = await api.post<GeneralResponse<{ attachmentId: string; attemptVersion: number }>>(
      `/v1/education/attempts/${encodeURIComponent(attemptId)}/responses/${encodeURIComponent(questionId)}/${kind}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    const data = readData(response.data, `Could not upload this ${kind} response.`);
    return { attemptId, version: data.attemptVersion, status: 'in-progress', attachmentId: data.attachmentId };
  },

  async start(assignmentId: string): Promise<EducationAssessmentAttempt> {
    const response = await api.post<GeneralResponse<EducationAttemptDto>>(
      `/v1/education/assignments/${encodeURIComponent(assignmentId)}/attempts`,
    );
    return readAttempt(readData(response.data, 'Could not start this assignment.'));
  },

  async get(attemptId: string): Promise<EducationAssessmentAttempt> {
    const response = await api.get<GeneralResponse<EducationAttemptDto>>(
      `/v1/education/attempts/${encodeURIComponent(attemptId)}`,
    );
    return readAttempt(readData(response.data, 'Could not restore this assignment.'));
  },

  async saveResponse(
    attemptId: string,
    request: SaveEducationAttemptResponseRequest,
  ): Promise<EducationAttemptSaveResult> {
    const response = await api.put<GeneralResponse<EducationAttemptSaveDto>>(
      `/v1/education/attempts/${encodeURIComponent(attemptId)}/responses`,
      request,
    );
    return readSave(readData(response.data, 'Could not save this answer.'));
  },

  async submit(attemptId: string): Promise<EducationAttemptSubmitResult> {
    const response = await api.post<GeneralResponse<EducationAttemptSubmitDto>>(
      `/v1/education/attempts/${encodeURIComponent(attemptId)}/submit`,
    );
    return readSubmit(readData(response.data, 'Could not submit this assignment.'));
  },

  async checkPracticeAnswer(attemptId: string, questionId: string, answer: EducationAttemptAnswerDto): Promise<EducationPracticeCheckResult> {
    const response = await api.post<GeneralResponse<EducationPracticeCheckResult>>(
      `/v1/education/attempts/${encodeURIComponent(attemptId)}/practice-check`,
      { questionId, answer },
    );
    return readData(response.data, 'Could not check this practice answer.');
  },
};
