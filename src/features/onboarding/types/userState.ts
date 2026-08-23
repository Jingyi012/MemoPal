import type { LessonProgress } from '@/features/palace';

export interface UserState {
  isFirstTime: boolean;
  hasCompletedOnboarding: boolean;
  lastVisitDate: string;
  totalVisits: number;
  currentStreak: number;

  ui: {
    tutorialPromptDismissed: boolean;
    tutorialViewedAt?: string | null;
    palaceListTab: 'official' | 'custom';
  };

  lessonsProgress: Record<string, LessonProgress>;

  preferences: {
    reviewTime: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };

  notifications: {
    reviewReminders: boolean;
    dailyLearningReminder: boolean;
  };

  subscription: {
    isPremium: boolean;
    planId?: string;
    startedAt?: string;
    expiresAt?: string;
    autoRenew: boolean;
    status?: 'active' | 'canceled' | 'past_due' | 'trialing';
  };
}

export const defaultUserState: UserState = {
  isFirstTime: true,
  hasCompletedOnboarding: false,
  lastVisitDate: new Date().toISOString(),
  totalVisits: 0,
  currentStreak: 0,
  lessonsProgress: {},
  ui: {
    tutorialPromptDismissed: false,
    tutorialViewedAt: null,
    palaceListTab: 'official',
  },
  preferences: {
    reviewTime: '09:00',
    theme: 'light',
    language: 'en',
    soundEnabled: true,
    hapticsEnabled: true,
  },
  notifications: {
    reviewReminders: true,
    dailyLearningReminder: false,
  },
  subscription: {
    isPremium: false,
    autoRenew: false,
  },
};

export type { LessonProgress };
