import type { EducationClassroomMembership } from '@/features/education/types/educationRelationship.types';

export function getActiveStudentClassroomsForUser(
  memberships: readonly EducationClassroomMembership[],
  userId: string | null | undefined,
) {
  if (!userId) return [];
  return [...new Map(memberships
    .filter(item => item.userId === userId && item.role === 'student' && item.status === 'active')
    .map(item => [item.classroomId, item])).values()];
}

export function createEducationClassroomCoursesQueryKey(userId: string, classroomId: string) {
  return ['education', 'guided-learning', userId, 'classroom-courses', classroomId] as const;
}
