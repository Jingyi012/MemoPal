export interface EducationAssignmentRecipientDto {
  id: string;
  studentUserId: string;
  assessmentId: string;
  assessmentVersion: number;
  title: string;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  includeInStudentLeaderboard: boolean;
}
export interface EducationAssignmentDto {
  id: string;
  scope: "classroom" | "family";
  classroomId: string | null;
  assessmentId: string;
  assessmentVersion: number;
  title: string;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  createdAt: string;
  resultsPublishedAt: string | null;
  studentLeaderboardEnabled: boolean;
  recipients: EducationAssignmentRecipientDto[];
  retakeOfAssignmentId: string | null;
  retakeReason: string | null;
}
export interface EducationAssignmentGradebookDto {
  assignmentId: string;
  title: string;
  resultsPublishedAt: string | null;
  students: EducationAssignmentGradeRowDto[];
}
export interface EducationAssignmentGradeRowDto {
  recipientId: string;
  studentUserId: string;
  studentName: string;
  status: "not-started" | "in-progress" | "submitted" | "awaiting-manual-grade";
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  gradeRevisionCount: number;
  attemptId: string | null;
  gradeRevisions: Array<{
    correctedByUserId: string;
    previousScore: number;
    newScore: number;
    maxScore: number;
    reason: string;
    correctedAt: string;
  }>;
  manualResponses: Array<{
    questionId: string;
    prompt: string;
    rubric: string;
    answer: string | null;
    photoAttachmentId: string | null;
    audioAttachmentId: string | null;
    maxScore: number;
    score: number | null;
    feedback: string | null;
    gradedByUserId: string | null;
    gradedAt: string | null;
  }>;
}
export interface CreateEducationAssignmentRequest {
  assessmentId: string;
  title: string;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  idempotencyKey: string;
  studentUserIds: string[];
  enableStudentLeaderboard: boolean;
}

export interface CreateEducationRetakeRequest {
  studentUserId: string;
  reason: string;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  idempotencyKey: string;
}

export interface CreateFamilyEducationAssignmentRequest {
  assessmentId: string;
  title: string;
  opensAt: string;
  dueAt: string;
  timeLimitMinutes: number | null;
  idempotencyKey: string;
  studentUserIds: string[];
}
