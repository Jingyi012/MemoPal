import type { MyEducationAssignment } from '../types/educationAssignment.types';

export type EducationAssignmentCourseGroup = Readonly<{
  courseId: string | null;
  courseTitle: string | null;
  assignments: readonly MyEducationAssignment[];
}>;

export function groupEducationAssignmentsByCourse(
  assignments: readonly MyEducationAssignment[],
): EducationAssignmentCourseGroup[] {
  const groups = new Map<string, { courseId: string | null; courseTitle: string | null; assignments: MyEducationAssignment[] }>();
  for (const assignment of assignments) {
    const groupId = assignment.courseId ?? `unfiled:${assignment.id}`;
    const group = groups.get(groupId) ?? {
      courseId: assignment.courseId,
      courseTitle: assignment.courseTitle,
      assignments: [],
    };
    group.assignments.push(assignment);
    groups.set(groupId, group);
  }
  return [...groups.values()];
}
