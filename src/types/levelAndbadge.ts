export interface UserLevel {
  currentLevel: number;
  xp: number;
  xpToNextLevel: number;
  title?: string;
}

export interface UserStat {
  totalBadgeEarned: number;
  streak: number;
  totalWordsLearned: number;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  rarity: BadgeRarity;
  isEarned: boolean;
}

export interface Milestone {
  level: number;
  reward: string;
  isLocked: boolean;
}

export interface LevelsAndBadgesResponse {
  level: UserLevel;
  stat: UserStat;
  badges: Badge[];
  milestones: Milestone[];
}
