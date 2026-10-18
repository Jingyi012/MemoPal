import assert from 'node:assert/strict';
import test from 'node:test';
import { groupEducationAssignmentsByCourse } from '../src/features/education/utils/groupEducationAssignmentsByCourse.ts';

const assignment = (id, courseId, courseTitle) => ({ id, courseId, courseTitle });

test('groups student assignments by assigned course while preserving task order', () => {
  const groups = groupEducationAssignmentsByCourse([
    assignment('task-1', 'course-a', 'Biology'),
    assignment('task-2', 'course-b', 'History'),
    assignment('task-3', 'course-a', 'Biology'),
  ]);

  assert.deepEqual(groups.map(group => group.courseTitle), ['Biology', 'History']);
  assert.deepEqual(groups[0].assignments.map(item => item.id), ['task-1', 'task-3']);
  assert.deepEqual(groups[1].assignments.map(item => item.id), ['task-2']);
});

test('returns no course sections when the student has no assignments', () => {
  assert.deepEqual(groupEducationAssignmentsByCourse([]), []);
});
