export interface BadgeDefinitionDto {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  iconUrl?: string | null;
  rarity?: string | null;
  conditionType: string;
  conditionValue: number;
}

export interface BadgeDefinitionUpsertRequest {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
  rarity?: string;
  conditionType: string;
  conditionValue: number;
}

export interface MilestoneDefinitionDto {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: string;
  conditionValue: number;
}

export interface MilestoneDefinitionUpsertRequest {
  key: string;
  title: string;
  description?: string;
  conditionType: string;
  conditionValue: number;
}

export interface MissionTemplateDto {
  key: string;
  title: string;
  description?: string | null;
  metricType: string;
  period: string;
  targetValue: number;
  rewardXp: number;
  sortOrder: number;
  isActive: boolean;
}
