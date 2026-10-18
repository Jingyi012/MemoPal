export interface EducationCourseReportItem {
  id: string;
  reason: string;
  details: string | null;
  status: EducationCourseReportStatus;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAtUtc: string | null;
}

export type EducationCourseReportStatus = "pending" | "resolved" | "dismissed";

export interface EducationCourseReportQueueItem {
  courseId: string;
  title: string;
  authorDisplayName: string;
  isPublic: boolean;
  isModerationHidden: boolean;
  moderationHiddenReason: string | null;
  moderationHiddenAtUtc: string | null;
  reportCount: number;
  reports: EducationCourseReportItem[];
}
