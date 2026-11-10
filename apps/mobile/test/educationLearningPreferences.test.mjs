import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLearningPreferences, recommendFirstCourse } from '../src/features/education/utils/educationLearningPreferences.ts';

const preference = { subject: 'chinese', stage: 'early-primary', language: 'zh-Hans' };
const courses = [
  { id: 'legacy', isMemoPalStarter: true, title: 'Chinese' },
  { id: 'english', isMemoPalStarter: true, subjectCode: 'english', learningStage: 'early-primary', languageCode: 'en' },
  { id: 'community', isMemoPalStarter: false, subjectCode: 'chinese', learningStage: 'early-primary', languageCode: 'zh-Hans' },
  { id: 'official', isMemoPalStarter: true, subjectCode: 'chinese', learningStage: 'early-primary', languageCode: 'zh-Hans' },
];
test('saved preferences are validated and projected without unrelated data', () => {
  assert.deepEqual(parseLearningPreferences(JSON.stringify({ ...preference, ignored: 'extra' })), preference);
  for (const input of [null, '{broken', 'null', '[]', '{}', JSON.stringify({ ...preference, stage: 'unknown' })]) {
    assert.equal(parseLearningPreferences(input), null);
  }
});
test('recommendations prefer matching official content over unrelated starters', () => {
  assert.equal(recommendFirstCourse(courses, preference).course.id, 'official');
  assert.equal(recommendFirstCourse(courses.slice(0, 3), preference).course.id, 'community');
  assert.equal(recommendFirstCourse(courses, preference).isFallback, false);
});
test('missing metadata cannot masquerade as a matching course, and fallback is explicit', () => {
  const result = recommendFirstCourse(courses, { ...preference, language: 'ms' });
  assert.equal(result.course.id, 'legacy');
  assert.equal(result.isFallback, true);
  assert.deepEqual(recommendFirstCourse([], preference), { course: undefined, isFallback: false });
});
test('skipping personalization keeps the catalog starter and all remains unrestricted', () => {
  assert.equal(recommendFirstCourse(courses, null).course.id, 'legacy');
  assert.equal(recommendFirstCourse(courses, { subject: 'all', stage: 'all', language: 'all' }).isFallback, false);
});
