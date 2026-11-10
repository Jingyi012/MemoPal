export type ClassroomRole = "owner" | "teacher" | "student";
export type RelationshipStatus = "pending" | "active" | "revoked";

export interface ClassroomDto {
  id: string;
  name: string;
  role: ClassroomRole;
  createdAt: string;
}

export interface EducationMembershipDto {
  id: string;
  classroomId: string;
  userId: string;
  role: "teacher" | "student";
  status: RelationshipStatus;
  expiresAt: string;
  acceptedAt: string | null;
  classroomName?: string | null;
  userDisplayName?: string | null;
}

export interface GuardianLinkDto {
  id: string;
  guardianUserId: string;
  studentUserId: string;
  status: RelationshipStatus;
  studentConfirmed: boolean;
  adminVerified: boolean;
  createdAt: string;
  guardianDisplayName?: string | null;
  studentDisplayName?: string | null;
}

export interface CreateClassroomRequest {
  name: string;
}
export interface InviteClassroomMemberRequest {
  userId: string;
  role: "teacher" | "student";
}
export interface CreateGuardianLinkRequest {
  studentUserId: string;
}

export interface EducationClassroomCourseSummaryDto {
  classroomId: string; courseId: string; title: string; attachedAtUtc: string;
  guidedPracticeEnabled: boolean; canManageGuidedPractice: boolean;
  objectives: { id: string; title: string; memoryContentType: string; languageCode: string | null; publishedStudyItemCount: number }[];
}
export interface EducationCourseClassroomDto { classroomId: string; classroomName: string; attachedAtUtc: string }
