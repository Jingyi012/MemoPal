export interface SystemSettingDto {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSystemSettingRequest {
  key: string;
  value: string;
  description?: string;
}
