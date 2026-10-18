export type CommunityMemorySetStatus = "visible" | "hidden";

export interface CommunityMemorySetAuthorDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MemorySetReportView {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
}

export interface CommunityMemorySetView {
  id: string;
  title: string;
  description: string | null;
  goalType: string;
  techniqueKey: string;
  visibility: string;
  communityStatus: CommunityMemorySetStatus;
  publishedAt: string | null;
  featuredAt: string | null;
  hiddenAt: string | null;
  hiddenReason: string | null;
  author: CommunityMemorySetAuthorDto;
  itemCount: number;
  copyCount: number;
  reportCount: number;
  reports: MemorySetReportView[];
  createdAt: string;
  updatedAt: string;
}
