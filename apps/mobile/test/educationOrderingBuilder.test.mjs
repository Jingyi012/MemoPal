import assert from 'node:assert/strict';
import test from 'node:test';
import { addEducationOrderingOption, isEducationOrderingAnswerComplete, removeEducationOrderingOption } from '../src/features/education/utils/educationOrderingBuilder.ts';

const question = { id: 'q', prompt: 'Build it', type: 'ordering', options: [
  { id: 'first', label: 'go' }, { id: 'second', label: 'go' }, { id: 'third', label: 'home' },
] };

test('word bank selection uses option ids for repeated labels and ignores duplicate selections', () => {
  const selected = addEducationOrderingOption(['first'], 'second', ['first', 'second', 'third']);
  assert.deepEqual(selected, ['first', 'second']);
  assert.deepEqual(addEducationOrderingOption(selected, 'second', ['first', 'second', 'third']), selected);
  assert.deepEqual(addEducationOrderingOption(selected, 'outside', ['first', 'second', 'third']), selected);
});

test('allows returning a chosen token to the word bank and requires a full unique answer before checking', () => {
  const partial = addEducationOrderingOption(['first'], 'third', ['first', 'second', 'third']);
  assert.deepEqual(removeEducationOrderingOption(partial, 'first'), ['third']);
  assert.equal(isEducationOrderingAnswerComplete(question, { type: 'ordering', orderedOptionIds: ['first', 'third'] }), false);
  assert.equal(isEducationOrderingAnswerComplete(question, { type: 'ordering', orderedOptionIds: ['first', 'second', 'third'] }), true);
  assert.equal(isEducationOrderingAnswerComplete(question, { type: 'ordering', orderedOptionIds: ['first', 'first', 'third'] }), false);
});
