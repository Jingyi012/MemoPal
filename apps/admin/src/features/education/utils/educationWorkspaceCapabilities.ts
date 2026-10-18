import type { ClassroomDto, EducationMembershipDto, GuardianLinkDto } from '../../../types/educationRelationships';

export type EducationWorkspaceCapabilities = Readonly<{
  learner: boolean;
  classroomEducator: boolean;
  guardian: boolean;
}>;

export function getEducationWorkspaceCapabilities(input: Readonly<{
  userId: string;
  classrooms: readonly ClassroomDto[];
  memberships: readonly EducationMembershipDto[];
  guardianLinks: readonly GuardianLinkDto[];
  now?: number;
}>): EducationWorkspaceCapabilities {
  const now = input.now ?? Date.now();
  const activeMemberships = input.memberships.filter(membership =>
    membership.status === 'active' && new Date(membership.expiresAt).getTime() > now,
  );
  return {
    learner: activeMemberships.some(membership => membership.role === 'student'),
    classroomEducator: input.classrooms.some(classroom => classroom.role === 'owner' || classroom.role === 'teacher') ||
      activeMemberships.some(membership => membership.role === 'teacher'),
    guardian: input.guardianLinks.some(link =>
      link.guardianUserId === input.userId && link.status === 'active' &&
      link.studentConfirmed && link.adminVerified,
    ),
  };
}
