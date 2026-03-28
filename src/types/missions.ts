export interface MissionProgress {
  key: string;
  title: string;
  description?: string | null;
  metricType: string;
  period: string;
  currentValue: number;
  targetValue: number;
  rewardXp: number;
  sortOrder: number;
  isActive: boolean;
  isCompleted: boolean;
  progressPercent: number;
}

export interface MissionDashboard {
  generatedAtUtc: string;
  missions: MissionProgress[];
}
