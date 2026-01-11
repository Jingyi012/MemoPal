import { LessonProgress } from './lesson';

// ==========================
// Top-Level User State
// ==========================
export interface UserState {
  // ----- Onboarding & app usage -----
  isFirstTime: boolean; // True if user just installed
  hasCompletedOnboarding: boolean; // Finished welcome/tutorial
  lastVisitDate: string; // ISO string of last app visit
  totalVisits: number; // Total times opened app
  currentStreak: number; // Consecutive daily usage streak

  // ----- Lessons & progress -----
  lessonsProgress: {
    [lessonId: string]: LessonProgress; // map lessonId → progress
  };
  hasStartedAnyLesson: boolean; // True if user started any lesson
  hasCompletedFirstLesson: boolean; // True if first lesson is completed

  // ----- Preferences & settings -----
  preferences: UserPreferences;

  // ----- Notifications -----
  notifications: NotificationSettings;

  // ----- Premium & subscription -----
  subscription: SubscriptionState;
}

// ==========================
// Preferences & Settings
// ==========================
export interface UserPreferences {
  preferredLearningTime: string | null; // "08:00", "21:30"
  reviewTime: string; // Daily review notification
  theme: 'light' | 'dark' | 'auto';
  showWelcomeModal: boolean;
  showTutorial: boolean;
  language: string; // e.g., 'en', 'es'
  soundEnabled: boolean; // Sound effects in lessons
  hapticsEnabled: boolean; // Vibration feedback
}

// ==========================
// Notifications
// ==========================
export interface NotificationSettings {
  reviewReminders: boolean; // Notify the user when a review is due (main app feature)
  dailySummary: boolean; // Notify the user daily about completed lessons, streaks, etc.
  weeklyProgress: boolean; // Notify the user weekly with progress summary (streaks, mastery)
  promotions?: boolean; // Optional: notify about new features, premium offers
  systemAlerts?: boolean; // Optional: notify about system updates, downtime, etc.
}

// ==========================
// Subscription / Premium
// ==========================
export interface SubscriptionState {
  isPremium: boolean; // Whether the user has premium access
  planId?: string; // Backend subscription plan ID
  startedAt?: string; // When subscription started
  expiresAt?: string; // When subscription will expire
  autoRenew: boolean; // If subscription auto-renews
  paymentMethod?: string; // e.g., 'card', 'paypal', 'apple', 'google'
  status?: 'active' | 'canceled' | 'past_due' | 'trialing'; // Backend subscription status
  trialEndsAt?: string; // If user is in trial, trial end date
  features?: Record<string, boolean>; // Optional: track unlocked premium features
}

// ==========================
// Default User State
// ==========================
export const defaultUserState: UserState = {
  isFirstTime: true,
  hasCompletedOnboarding: false,
  lastVisitDate: new Date().toISOString(),
  totalVisits: 0,
  currentStreak: 0,
  lessonsProgress: {},
  hasStartedAnyLesson: false,
  hasCompletedFirstLesson: false,
  preferences: {
    preferredLearningTime: null,
    reviewTime: '09:00',
    theme: 'light',
    showWelcomeModal: true,
    showTutorial: true,
    language: 'en',
    soundEnabled: true,
    hapticsEnabled: true,
  },
  notifications: {
    reviewReminders: true,
    dailySummary: false,
    weeklyProgress: false,
  },
  subscription: {
    isPremium: false,
    autoRenew: false,
  },
};
export { LessonProgress };
