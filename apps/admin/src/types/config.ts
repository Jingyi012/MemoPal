export interface MilestoneDefinitionDto {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: string;
  conditionValue: number;
  createdAt: string;
  createdBy?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface MilestoneDefinitionUpsertRequest {
  key: string;
  title: string;
  description?: string;
  conditionType: string;
  conditionValue: number;
}
