export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  avatarSource?: 'companion' | 'photo';
  selectedAvatarId?: string | null;
  selectedAvatarFrameId?: string | null;
  selectedAvatarDecorationId?: string | null;
  selectedAvatarOutfitId?: string | null;
  email: string;
  totalXp: number;
  level: number;
  isPremium: boolean;
  onboardingVersion?: number;
  onboardingStatus?: 'not-started' | 'in-progress' | 'completed' | 'skipped';
  onboardingStep?: 'choose-category' | 'build-memory' | 'practice-memory' | 'finished';
  onboardingSelectedCategoryId?: string | null;
  onboardingSelectedLessonId?: string | null;
  onboardingMemorySetId?: string | null;
  onboardingCompletedAt?: string | null;
  onboardingSkippedAt?: string | null;
  stats?: UserStats;
}

export interface UserStats {
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string | null;
}
