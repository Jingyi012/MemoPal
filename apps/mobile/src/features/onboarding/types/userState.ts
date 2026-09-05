export type AppLanguage = 'system' | 'en' | 'zh';

export interface UserState {
  lastVisitDate: string;
  totalVisits: number;
  currentStreak: number;

  ui: {
    tutorialPromptDismissed: boolean;
    tutorialViewedAt?: string | null;
    libraryViewMode: 'card' | 'list';
  };

  preferences: {
    reviewTime: string;
    theme: 'light' | 'dark' | 'auto';
    language: AppLanguage;
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
  lastVisitDate: new Date().toISOString(),
  totalVisits: 0,
  currentStreak: 0,
  ui: {
    tutorialPromptDismissed: false,
    tutorialViewedAt: null,
    libraryViewMode: 'card',
  },
  preferences: {
    reviewTime: '09:00',
    theme: 'light',
    language: 'system',
    soundEnabled: true,
    hapticsEnabled: true,
  },
  notifications: {
    reviewReminders: false,
    dailyLearningReminder: false,
  },
  subscription: {
    isPremium: false,
    autoRenew: false,
  },
};
