import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafeAuthReturnTo } from '../src/features/auth/utils/safeAuthReturnTo.ts';

test('allows known public Community deep links after authentication', () => {
  assert.equal(getSafeAuthReturnTo('/community/memory-sets/01abc_X-9'), '/community/memory-sets/01abc_X-9');
  assert.equal(getSafeAuthReturnTo('/community/leaderboard'), '/community/leaderboard');
  assert.equal(getSafeAuthReturnTo('/community/education'), '/community/education');
  assert.equal(getSafeAuthReturnTo('/community/education/saved'), '/community/education/saved');
  assert.equal(getSafeAuthReturnTo('/community/education/history'), '/community/education/history');
  assert.equal(getSafeAuthReturnTo('/community/education/course_01'), '/community/education/course_01');
  assert.equal(getSafeAuthReturnTo('/community/education/course_01/assessment_02'), '/community/education/course_01/assessment_02');
});

test('rejects external, malformed, unrelated, and non-string return destinations', () => {
  for (const candidate of [
    '//evil.example',
    'https://evil.example/community/memory-sets/abc',
    '/community/memory-sets/a%2Fb',
    '/community/memory-sets/abc?next=//evil.example',
    '/community/education/course/assessment/extra',
    '/community/education/course%2Fother',
    '/community/education/course?next=//evil.example',
    '/community/leaderboard?redirect=//evil.example',
    '/admin/users',
    [' /community/memory-sets/abc'],
    null,
  ]) {
    assert.equal(getSafeAuthReturnTo(candidate), null);
  }
});
