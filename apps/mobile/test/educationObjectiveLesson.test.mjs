import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseObjectiveLesson, studyObjectivesForLesson } from '../src/features/education/utils/educationObjectiveLesson.ts';

const lesson = (id, objectiveId, complete = false, incorrect = 0) => ({ assessmentId: id, objectives: [{ objectiveId }], isComplete: complete, latestIncorrectQuestionCount: incorrect });
test('reading an objective continues the server recommended associated lesson', () => {
  assert.equal(chooseObjectiveLesson('a', { lessons: [lesson('one', 'a'), lesson('two', 'a')], nextRecommendedAssessmentId: 'two' }).assessmentId, 'two');
});
test('a recommendation for another objective cannot redirect this study flow', () => {
  assert.equal(chooseObjectiveLesson('a', { lessons: [lesson('one', 'a', true), lesson('two', 'a'), lesson('three', 'b')], nextRecommendedAssessmentId: 'three' }).assessmentId, 'two');
});
test('after all lessons complete, offer a lesson with remaining incorrect responses', () => {
  assert.equal(chooseObjectiveLesson('a', { lessons: [lesson('one', 'a', true), lesson('two', 'a', true, 1)] }).assessmentId, 'two');
});
test('missing progress or unrelated lessons leave reading available without inventing a practice', () => {
  assert.equal(chooseObjectiveLesson('a'), undefined);
  assert.equal(chooseObjectiveLesson('a', { lessons: [lesson('other', 'b')] }), undefined);
});

const objectives = [{ id: 'a', studyItems: [{}] }, { id: 'b', studyItems: [{}] }, { id: 'empty', studyItems: [] }, { id: 'unrelated', studyItems: [{}] }];
const newLesson = { isStarted: false, objectives: [{ objectiveId: 'a' }, { objectiveId: 'b' }, { objectiveId: 'empty' }] };
test('new practice teaches only its associated published content in course order', () => {
  assert.deepEqual(studyObjectivesForLesson(objectives, newLesson), ['a', 'b']);
});
test('finishing one study point does not repeat it before teaching the other related points', () => {
  assert.deepEqual(studyObjectivesForLesson(objectives, newLesson, 'a'), ['b']);
});
test('resumed practice and unknown progress do not invent a new reading requirement', () => {
  assert.deepEqual(studyObjectivesForLesson(objectives, { ...newLesson, isStarted: true }), []);
  assert.deepEqual(studyObjectivesForLesson(objectives, undefined), []);
});
