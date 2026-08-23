export interface LevelConfigs {
  level: number;
  requiredXp: number;
  title?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface LevelConfigVersion {
  version: string;
  latestUpdatedAt?: string | null;
  activeCount: number;
}
