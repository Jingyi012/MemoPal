import test from 'node:test';
import assert from 'node:assert/strict';
import { learningSubjectFor, courseAudienceLabels, matchesCourseAudience, emptyCourseAudience } from '../src/features/education/utils/educationCourseAudience.ts';

test('author subject beats misleading title words and unsupported subjects use a neutral theme', () => {
  assert.equal(learningSubjectFor('English mathematicians', 'history'), 'other');
  assert.equal(learningSubjectFor('The garden', 'chinese'), 'chinese');
  assert.equal(learningSubjectFor('Math words', 'english'), 'english');
});
test('legacy title detection supports Chinese without assigning an age or language', () => {
  assert.equal(learningSubjectFor('中文：我的校园'), 'chinese');
  assert.equal(learningSubjectFor('Science: seeds'), 'science');
  assert.deepEqual(courseAudienceLabels({}, true), []);
});
test('audience labels translate metadata rather than guessing from titles', () => {
  assert.deepEqual(courseAudienceLabels({ learningStage: 'early-primary', languageCode: 'en' }, true), ['小学低年级', '英文内容']);
  assert.deepEqual(courseAudienceLabels({ learningStage: 'secondary', languageCode: 'ms' }, false), ['Secondary', 'Malay content']);
});

test('stage and language filters must both match, without inventing missing metadata', () => {
  const course = { learningStage: 'early-primary', languageCode: 'zh-Hans' };
  assert.equal(matchesCourseAudience(course, { stage: 'early-primary', language: 'zh-Hans' }), true);
  assert.equal(matchesCourseAudience(course, { stage: 'secondary', language: 'zh-Hans' }), false);
  assert.equal(matchesCourseAudience(course, { stage: 'early-primary', language: 'en' }), false);
  assert.equal(matchesCourseAudience({}, { stage: 'early-primary', language: 'all' }), false);
  assert.equal(matchesCourseAudience({}, emptyCourseAudience), true);
});

test('general exploration is an explicit stage, not an assertion of suitability for every grade', () => {
  assert.equal(matchesCourseAudience({ learningStage: 'general' }, { stage: 'early-primary', language: 'all' }), false);
  assert.equal(matchesCourseAudience({ learningStage: 'general' }, { stage: 'general', language: 'all' }), true);
});
