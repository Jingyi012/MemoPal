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
