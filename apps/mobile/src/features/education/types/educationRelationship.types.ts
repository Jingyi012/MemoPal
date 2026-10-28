export type EducationClassroomMembership = Readonly<{
  id: string;
  classroomId: string;
  userId: string;
  role: 'student' | 'teacher' | string;
  status: 'pending' | 'active' | 'revoked' | string;
  expiresAt: string;
  acceptedAt: string | null;
  classroomName: string | null;
}>;

export type EducationClassroomCourse = Readonly<{
  classroomId: string;
  courseId: string;
  title: string;
  attachedAtUtc: string;
  guidedPracticeEnabled: boolean;
  canManageGuidedPractice: boolean;
  objectives: readonly Readonly<{
    id: string;
    title: string;
    memoryContentType: string;
    languageCode: string | null;
    publishedStudyItemCount: number;
  }>[];
}>;

export type EducationGuardianLink = Readonly<{
  id: string;
  guardianUserId: string;
  studentUserId: string;
  status: string;
  studentConfirmed: boolean;
  adminVerified: boolean;
  createdAt: string;
  guardianDisplayName?: string | null;
  studentDisplayName?: string | null;
}>;
