export interface XpConfigDto {
  id: string;
  sourceType: string;
  baseXp: number;
  variableXp: number;
  isActive: boolean;
}

export interface XpConfigUpsertRequest {
  sourceType: string;
  baseXp: number;
  variableXp: number;
  isActive: boolean;
}

export interface LevelConfigDto {
  level: number;
  requiredXp: number;
  title?: string | null;
}

export interface LevelConfigUpsertRequest {
  requiredXp: number;
  title?: string;
}

export interface BadgeDefinitionDto {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  iconUrl?: string | null;
  rarity?: string | null;
}

export interface BadgeDefinitionUpsertRequest {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
  rarity?: string;
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
