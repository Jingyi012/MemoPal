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
