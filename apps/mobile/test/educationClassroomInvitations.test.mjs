import test from 'node:test';
import assert from 'node:assert/strict';
import { getPendingEducationInvitations } from '../src/features/education/utils/classroomInvitations.ts';

test('shows only invitations that are pending and have not expired', () => {
  const rows = [
    { id: 'pending', status: 'pending', expiresAt: '2026-10-19T00:00:00Z' },
    { id: 'accepted', status: 'active', expiresAt: '2026-10-19T00:00:00Z' },
    { id: 'expired', status: 'pending', expiresAt: '2026-10-17T00:00:00Z' },
    { id: 'invalid', status: 'pending', expiresAt: 'not-a-date' },
  ];

  assert.deepEqual(getPendingEducationInvitations(rows, Date.parse('2026-10-18T00:00:00Z')), [rows[0]]);
});
