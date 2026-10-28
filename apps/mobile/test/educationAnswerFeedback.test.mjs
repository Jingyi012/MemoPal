import test from 'node:test';
import assert from 'node:assert/strict';
import { educationCorrectAnswerText } from '../src/features/education/utils/educationCorrectAnswer.ts';
import { educationFillPromptParts } from '../src/features/education/utils/educationFillWordBank.ts';

const labels = { trueLabel: '对', falseLabel: '错' };
const options = [{ id: 'a', label: 'Water' }, { id: 'b', label: 'Light' }, { id: 'c', label: 'Candy' }];
test('renders the server answer for each objective question type using visible labels', () => {
  const cases = [
    [{ type: 'single-choice', options }, { type: 'single-choice', optionId: 'a' }, 'Water'],
    [{ type: 'multiple-select', options }, { type: 'multiple-select', optionIds: ['a', 'b'] }, 'Water · Light'],
    [{ type: 'true-false' }, { type: 'true-false', booleanValue: false }, '错'],
    [{ type: 'fill-blank', fillMode: 'text' }, { type: 'text', textValue: '萌发' }, '萌发'],
    [{ type: 'fill-blank', fillMode: 'number' }, { type: 'number', numericValue: '3.5' }, '3.5'],
    [{ type: 'ordering', options }, { type: 'ordering', orderedOptionIds: ['b', 'a', 'c'] }, 'Light → Water → Candy'],
    [{ type: 'matching', options, matchTargets: [{ id: 'x', label: 'Absorbs' }] }, { type: 'matching', matches: [{ leftOptionId: 'a', matchTargetId: 'x' }] }, 'Water → Absorbs'],
  ];
  for (const [question, answer, expected] of cases) assert.equal(educationCorrectAnswerText(question, answer, labels), expected);
});
test('does not invent answers or display unknown IDs when feedback is missing or inconsistent', () => {
  assert.equal(educationCorrectAnswerText({ type: 'single-choice', options }, null, labels), null);
  assert.equal(educationCorrectAnswerText({ type: 'single-choice', options }, { type: 'single-choice', optionId: 'private-unknown' }, labels), null);
  assert.equal(educationCorrectAnswerText({ type: 'true-false' }, { type: 'text', textValue: 'not a boolean' }, labels), null);
});
test('places a selected word in the first ASCII or full-width blank without losing surrounding text', () => {
  assert.deepEqual(educationFillPromptParts('Can I ___ your ruler?'), { before: 'Can I ', after: ' your ruler?' });
  assert.deepEqual(educationFillPromptParts('常先长出小＿＿＿。'), { before: '常先长出小', after: '。' });
  assert.deepEqual(educationFillPromptParts('填写答案'), { before: '填写答案 ', after: '' });
  assert.deepEqual(educationFillPromptParts('___ then ___'), { before: '', after: ' then ___' });
});
