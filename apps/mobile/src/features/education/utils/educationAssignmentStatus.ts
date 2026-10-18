import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';

export type EducationAssignmentStatus = 'upcoming' | 'open' | 'pastDue';

export function getEducationAssignmentStatus(
  assignment: MyEducationAssignment,
  now = Date.now(),
): EducationAssignmentStatus {
  if (now < new Date(assignment.opensAt).getTime()) return 'upcoming';
  if (now <= new Date(assignment.dueAt).getTime()) return 'open';
  return 'pastDue';
}
