import { describe, expect, it } from 'vitest';
import { getEducationWorkspaceCapabilities } from './educationWorkspaceCapabilities';

const base = {
  userId: 'person-1',
  now: Date.parse('2026-10-18T00:00:00Z'),
  classrooms: [],
  memberships: [],
  guardianLinks: [],
};

describe('getEducationWorkspaceCapabilities', () => {
  it('keeps learner, classroom educator, and guardian capabilities independent and overlapping', () => {
    expect(getEducationWorkspaceCapabilities({
      ...base,
      classrooms: [{ id: 'room-1', name: 'Math', role: 'owner', createdAt: '' }],
      memberships: [{ id: 'member-1', classroomId: 'room-2', userId: 'person-1', role: 'student', status: 'active', expiresAt: '2026-11-01T00:00:00Z', acceptedAt: null }],
      guardianLinks: [{ id: 'link-1', guardianUserId: 'person-1', studentUserId: 'child-1', status: 'active', studentConfirmed: true, adminVerified: true, createdAt: '' }],
    })).toEqual({ learner: true, classroomEducator: true, guardian: true });
  });

  it('does not infer capabilities from expired, pending, unverified, or another user’s relationships', () => {
    expect(getEducationWorkspaceCapabilities({
      ...base,
      memberships: [
        { id: 'expired', classroomId: 'room-1', userId: 'person-1', role: 'student', status: 'active', expiresAt: '2026-10-17T23:59:59Z', acceptedAt: null },
        { id: 'pending', classroomId: 'room-2', userId: 'person-1', role: 'teacher', status: 'pending', expiresAt: '2026-11-01T00:00:00Z', acceptedAt: null },
      ],
      guardianLinks: [
        { id: 'unverified', guardianUserId: 'person-1', studentUserId: 'child-1', status: 'active', studentConfirmed: true, adminVerified: false, createdAt: '' },
        { id: 'other-user', guardianUserId: 'other', studentUserId: 'child-2', status: 'active', studentConfirmed: true, adminVerified: true, createdAt: '' },
      ],
    })).toEqual({ learner: false, classroomEducator: false, guardian: false });
  });
});
