import test from 'node:test';
import assert from 'node:assert/strict';
import { getPendingEducationInvitations } from '../src/features/education/utils/classroomInvitations.ts';
import { createEducationClassroomCoursesQueryKey, getActiveStudentClassroomsForUser } from '../src/features/education/utils/educationClassroomLearning.ts';

test('shows only invitations that are pending and have not expired', () => {
  const rows = [
    { id: 'pending', status: 'pending', expiresAt: '2026-10-19T00:00:00Z' },
    { id: 'accepted', status: 'active', expiresAt: '2026-10-19T00:00:00Z' },
    { id: 'expired', status: 'pending', expiresAt: '2026-10-17T00:00:00Z' },
    { id: 'invalid', status: 'pending', expiresAt: 'not-a-date' },
  ];

  assert.deepEqual(getPendingEducationInvitations(rows, Date.parse('2026-10-18T00:00:00Z')), [rows[0]]);
});

test('classroom learning only queries active student memberships for the signed-in user', () => {
  const rows = [
    { id: 'mine', userId: 'user-a', classroomId: 'class-a', classroomName: 'A', role: 'student', status: 'active' },
    { id: 'other-user', userId: 'user-b', classroomId: 'class-b', classroomName: 'B', role: 'student', status: 'active' },
    { id: 'teacher-only', userId: 'user-a', classroomId: 'class-c', classroomName: 'C', role: 'teacher', status: 'active' },
    { id: 'pending', userId: 'user-a', classroomId: 'class-d', classroomName: 'D', role: 'student', status: 'pending' },
  ];

  assert.deepEqual(getActiveStudentClassroomsForUser(rows, 'user-a'), [rows[0]]);
  assert.deepEqual(getActiveStudentClassroomsForUser(rows, null), []);
  assert.notDeepEqual(createEducationClassroomCoursesQueryKey('user-a', 'class-a'), createEducationClassroomCoursesQueryKey('user-b', 'class-a'));
  assert.notDeepEqual(createEducationClassroomCoursesQueryKey('user-a', 'class-a'), createEducationClassroomCoursesQueryKey('user-a', 'class-b'));
});
