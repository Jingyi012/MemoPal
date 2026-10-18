import assert from 'node:assert/strict';
import test from 'node:test';
import { assignEducationMatch } from '../src/features/education/utils/assignEducationMatch.ts';

test('assigning a target keeps left and right items one-to-one', () => {
  const original = [
    { leftOptionId: 'left-a', matchTargetId: 'right-a' },
    { leftOptionId: 'left-b', matchTargetId: 'right-b' },
  ];
  assert.deepEqual(assignEducationMatch(original, 'left-a', 'right-b'), [
    { leftOptionId: 'left-a', matchTargetId: 'right-b' },
  ]);
  assert.deepEqual(original, [
    { leftOptionId: 'left-a', matchTargetId: 'right-a' },
    { leftOptionId: 'left-b', matchTargetId: 'right-b' },
  ]);
});

test('replacing one left item removes its old target assignment', () => {
  assert.deepEqual(assignEducationMatch([
    { leftOptionId: 'left-a', matchTargetId: 'right-a' },
    { leftOptionId: 'left-b', matchTargetId: 'right-b' },
  ], 'left-a', 'right-c'), [
    { leftOptionId: 'left-b', matchTargetId: 'right-b' },
    { leftOptionId: 'left-a', matchTargetId: 'right-c' },
  ]);
});
