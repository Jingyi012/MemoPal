import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLearningActivity, updateLearningActivity, learningResumeRoute } from '../src/features/education/utils/learningActivity.ts';

test('reading history accepts only valid local positions and known content sources', () => {
  assert.deepEqual(parseLearningActivity(null), []);
  assert.deepEqual(parseLearningActivity('broken'), []);
  const valid = { courseId: 'a', source: 'personal', updatedAt: '2026-11-09T00:00:00Z', position: 2, finished: false };
  assert.deepEqual(parseLearningActivity(JSON.stringify([valid, { ...valid, position: -1 }, { ...valid, source: 'other' }, { ...valid, sectionId: 2 }, { ...valid, updatedAt: 'bad' }])), [valid]);
});
test('returning to a course retains its real reading position without changing other courses', () => {
  const original = [{ courseId: 'a', source: 'personal', updatedAt: '2026-11-08T00:00:00Z', sectionId: 'unit', position: 3, finished: true }];
  const rows = updateLearningActivity(original, { source: 'public', courseId: 'a' }, '2026-11-09T00:00:00Z');
  const touched = updateLearningActivity(rows, { source: 'personal', courseId: 'a' }, '2026-11-09T01:00:00Z');
  assert.equal(touched.length, 2);
  assert.equal(touched[0].position, 3);
  assert.equal(touched[0].finished, true);
  assert.equal(touched[1].source, 'public');
  assert.equal(original[0].updatedAt, '2026-11-08T00:00:00Z');
});
test('reading a different section replaces the position and recent history stays bounded', () => {
  let rows = [];
  for (let n = 0; n < 14; n++) rows = updateLearningActivity(rows, { courseId: `${n}`, source: 'personal', sectionId: 'a', position: 4, finished: true }, '2026-11-09T00:00:00Z');
  rows = updateLearningActivity(rows, { courseId: '13', source: 'personal', sectionId: 'b', position: 0, finished: false }, '2026-11-09T00:00:01Z');
  assert.equal(rows.length, 12);
  assert.equal(rows[0].position, 0);
  assert.equal(rows[0].finished, false);
});
test('resume links enter study directly and encode content identifiers', () => {
  assert.equal(learningResumeRoute({ source: 'personal', courseId: 'a/b' }), '/education/my-courses/a%2Fb?start=1');
  assert.equal(learningResumeRoute({ source: 'public', courseId: 'x' }), '/community/education/x?resume=1');
});
