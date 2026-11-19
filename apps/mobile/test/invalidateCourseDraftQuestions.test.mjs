import assert from 'node:assert/strict';
import test from 'node:test';
import { invalidateCourseDraftQuestions, isRepeatedCourseMeaning, matchingCoursePairCells } from '../src/features/education/utils/invalidateCourseDraftQuestions.ts';

const input = { title: 'Words', languageCode: 'en', meaningLanguageCode: 'zh-Hans', difficulty: 'basic', units: [{ id: 'u1', title: 'Unit', entries: [
  { id: 'a', text: 'school', meaning: '学校' }, { id: 'b', text: 'sun', meaning: '太阳' }, { id: 'c', text: 'book', meaning: null },
] }] };
const output = { suggestions: [{ entryId: 'c', meaning: '书本', needsReview: false }], questions: [
  { unitId: 'u1', entryId: 'c', prompt: 'What is book?', type: 'single-choice', options: ['书本', '学校', '太阳'], correctOptionIndex: 0 },
  { unitId: 'u1', entryId: 'a', prompt: 'Match', type: 'matching', options: [], correctOptionIndex: -1, pairs: [{ entryId: 'a', left: 'school', right: '学校' }, { entryId: 'b', left: 'sun', right: '太阳' }] },
  { unitId: 'u1', entryId: 'b', prompt: 'Write sun', type: 'fill-blank', options: [], correctOptionIndex: -1, answer: 'sun' },
] };

test('invalidates target, distractor, and matching questions that reference an edited entry', () => {
  assert.deepEqual(invalidateCourseDraftQuestions(output, input, [0, 1, 2], ['a']), [2]);
  assert.deepEqual(invalidateCourseDraftQuestions(output, input, [0, 1, 2], ['b']), []);
  assert.deepEqual(invalidateCourseDraftQuestions(output, input, [0, 1, 2], ['c']), [1, 2]);
});

test('flags meanings that only repeat the source word', () => {
  assert.equal(isRepeatedCourseMeaning('book', 'book'), true);
  assert.equal(isRepeatedCourseMeaning('School!', 'school'), true);
  assert.equal(isRepeatedCourseMeaning('book', '书本'), false);
});

test('renders the API matching pair contract (left/right)', () => {
  assert.deepEqual(matchingCoursePairCells({ entryId: 'a', left: 'school', right: '学校' }), ['school', '学校']);
});
