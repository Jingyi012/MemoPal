import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseEducationHomeCourse } from '../src/features/education/utils/educationHomeCourse.ts';

const courses = [
  { id: 'starter-a', isMemoPalStarter: true },
  { id: 'starter-b', isMemoPalStarter: true },
];

test('Home honors the server-selected started incomplete course', () => {
  const progress = { courseId: 'starter-b', lessons: [{ isStarted: true, isComplete: false }] };
  assert.equal(chooseEducationHomeCourse(courses, progress)?.id, 'starter-b');
});

test('Home honors the server-selected latest course when all its lessons are complete', () => {
  const progress = { courseId: 'starter-b', lessons: [{ isStarted: true, isComplete: true }] };
  assert.equal(chooseEducationHomeCourse(courses, progress)?.id, 'starter-b');
});

test('Home offers a starter only when the server reports no course progress', () => {
  assert.equal(chooseEducationHomeCourse(courses, null)?.id, 'starter-a');
});

test('Home can continue a public started course outside the first catalog page', () => {
  const progress = { courseId: 'older-public-course', courseTitle: 'Older public course', lessons: [{ isStarted: true, isComplete: false }] };
  assert.equal(chooseEducationHomeCourse(courses, progress)?.id, 'older-public-course');
});
