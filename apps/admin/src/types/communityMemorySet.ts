export type CommunityMemorySetStatus = "visible" | "hidden";

export interface CommunityMemorySetAuthorDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AdminCommunityMemorySetDto {
  id: string;
  title: string;
  description: string | null;
  goalType: string;
  techniqueKey: string;
  visibility: string;
  communityStatus: CommunityMemorySetStatus;
  publishedAt: string | null;
  hiddenAt: string | null;
  hiddenReason: string | null;
  author: CommunityMemorySetAuthorDto;
  itemCount: number;
  copyCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}
