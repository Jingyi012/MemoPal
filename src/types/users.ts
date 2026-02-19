export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email: string;
  totalXp: number;
  level: number;
  isPremium: boolean;
  stats?: UserStats;
}

export interface UserStats {
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string | null;
}
