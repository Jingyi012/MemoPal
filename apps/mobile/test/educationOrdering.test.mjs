import assert from 'node:assert/strict';
import test from 'node:test';
import { reorderEducationOptionIds } from '../src/features/education/utils/reorderEducationOptionIds.ts';

test('moves an item in either direction without mutating the source order', () => {
  const source = ['first', 'second', 'third'];
  assert.deepEqual(reorderEducationOptionIds(source, 1, -1), ['second', 'first', 'third']);
  assert.deepEqual(reorderEducationOptionIds(source, 1, 1), ['first', 'third', 'second']);
  assert.deepEqual(source, ['first', 'second', 'third']);
});

test('keeps the order unchanged when a move would leave the list', () => {
  assert.deepEqual(reorderEducationOptionIds(['first', 'second'], 0, -1), ['first', 'second']);
  assert.deepEqual(reorderEducationOptionIds(['first', 'second'], 1, 1), ['first', 'second']);
});
