import test from 'node:test';
import assert from 'node:assert/strict';
import { isPhotoResponseBlank, readPhotoResponse, toPhotoResponseDto } from '../src/features/education/utils/educationPhotoResponse.ts';
import { isVoiceResponseBlank, readVoiceResponse, toVoiceResponseDto } from '../src/features/education/utils/educationVoiceResponse.ts';
import { isEducationResponseBlank } from '../src/features/education/utils/isEducationResponseBlank.ts';

test('unselected single-choice and true-false answers stay blank until a value is chosen', () => {
  assert.equal(isEducationResponseBlank({ id: 'q1', prompt: 'Pick one', type: 'single-choice', options: [] },
    { type: 'single-choice', optionId: null }), true);
  assert.equal(isEducationResponseBlank({ id: 'q1', prompt: 'Pick one', type: 'single-choice', options: [] },
    { type: 'single-choice', optionId: 'option-1' }), false);
  assert.equal(isEducationResponseBlank({ id: 'q2', prompt: 'True or false', type: 'true-false' },
    { type: 'true-false', value: null }), true);
  assert.equal(isEducationResponseBlank({ id: 'q2', prompt: 'True or false', type: 'true-false' },
    { type: 'true-false', value: false }), false);
});

test('whitespace-only fill-in answers stay blank', () => {
  assert.equal(isEducationResponseBlank({ id: 'q3', prompt: 'Answer', type: 'fill-blank', fillMode: 'text' },
    { type: 'fill-blank', text: '  \n ' }), true);
  assert.equal(isEducationResponseBlank({ id: 'q3', prompt: 'Answer', type: 'fill-blank', fillMode: 'text' },
    { type: 'fill-blank', text: 'answer' }), false);
});

test('the shared blank-answer rule covers choice lists, written responses and private attachments', () => {
  const cases = [
    [
      { id: 'q4', prompt: 'Choose all', type: 'multiple-select', options: [] },
      { type: 'multiple-select', optionIds: [] },
      { type: 'multiple-select', optionIds: ['option-1'] },
    ],
    [
      { id: 'q5', prompt: 'Order these', type: 'ordering', options: [] },
      { type: 'ordering', orderedOptionIds: [] },
      { type: 'ordering', orderedOptionIds: ['option-1'] },
    ],
    [
      { id: 'q6', prompt: 'Match these', type: 'matching', options: [], matchTargets: [] },
      { type: 'matching', matches: [] },
      { type: 'matching', matches: [{ leftOptionId: 'left-1', matchTargetId: 'right-1' }] },
    ],
    [
      { id: 'q7', prompt: 'Explain', type: 'written-response' },
      { type: 'written-response', text: '   ' },
      { type: 'written-response', text: 'A short explanation' },
    ],
    [
      { id: 'q8', prompt: 'Add a photo', type: 'photo-response' },
      { type: 'photo-response', photoAttachmentId: null },
      { type: 'photo-response', photoAttachmentId: 'photo-1' },
    ],
    [
      { id: 'q9', prompt: 'Record your answer', type: 'voice-response' },
      { type: 'voice-response', audioAttachmentId: null },
      { type: 'voice-response', audioAttachmentId: 'audio-1' },
    ],
  ];

  for (const [question, blankAnswer, answered] of cases) {
    assert.equal(isEducationResponseBlank(question, blankAnswer), true, `${question.type} blank state`);
    assert.equal(isEducationResponseBlank(question, answered), false, `${question.type} answered state`);
  }
});

test('photo answers restore from private attachment ID without exposing a storage URL', () => {
  const answer = readPhotoResponse({ type: 'photo-response', photoAttachmentId: 'attachment-123' });
  assert.deepEqual(answer, { type: 'photo-response', photoAttachmentId: 'attachment-123' });
  assert.deepEqual(toPhotoResponseDto(answer.photoAttachmentId), {
    type: 'photo-response', photoAttachmentId: 'attachment-123',
  });
  assert.equal(isPhotoResponseBlank(answer.photoAttachmentId), false);
});

test('unanswered photo prompts remain blank until an upload is committed', () => {
  assert.equal(isPhotoResponseBlank(null), true);
  assert.equal(readPhotoResponse({ type: 'photo-response', photoAttachmentId: null }), null);
});

test('voice answers restore from a private attachment ID and never serialize a local recording URI', () => {
  const answer = readVoiceResponse({ type: 'voice-response', audioAttachmentId: 'audio-123' });
  assert.deepEqual(answer, { type: 'voice-response', audioAttachmentId: 'audio-123' });
  assert.deepEqual(toVoiceResponseDto(answer.audioAttachmentId), {
    type: 'voice-response', audioAttachmentId: 'audio-123',
  });
  assert.equal(isVoiceResponseBlank(answer.audioAttachmentId), false);
  assert.equal(JSON.stringify(answer).includes('file://'), false);
});

test('unanswered voice prompts remain blank until an upload is committed', () => {
  assert.equal(isVoiceResponseBlank(null), true);
  assert.equal(readVoiceResponse({ type: 'voice-response', audioAttachmentId: null }), null);
});
