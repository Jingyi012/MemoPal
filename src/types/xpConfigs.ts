import { SourceType } from '@/enums/sourceType';

export interface XpConfig {
  id: string;
  sourceType: SourceType;
  baseXp: number;
  variableXp: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
