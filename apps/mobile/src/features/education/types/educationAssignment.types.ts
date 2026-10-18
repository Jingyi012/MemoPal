export type EducationAssignmentScope = 'classroom' | 'family';

/** Student-safe assignment metadata. This DTO intentionally excludes assessment content and answers. */
export type MyEducationAssignment = Readonly<{
  id: string;
  assessmentId: string;
  assessmentVersion: number;
  courseId: string | null;
  courseTitle: string | null;
  title: string;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  scope: EducationAssignmentScope;
  classroomId: string | null;
  studentLeaderboardEnabled: boolean;
  includeInStudentLeaderboard: boolean;
  resultsPublishedAt: string | null;
}>;
