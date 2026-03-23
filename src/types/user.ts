export type UserRole = 'User' | 'Admin';

export interface ManagedUserDto {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  totalXp: number;
  level: number;
  isPremium: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserUpsertRequest {
  displayName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  role?: UserRole;
  totalXp?: number;
  level?: number;
  isPremium?: boolean;
  isDeleted?: boolean;
}

export interface ManagedUserLocationDataDto {
  id: string;
  palaceId: string;
  position: number;
  name: string;
  description: string;
  imageUrl: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserPalaceDataDto {
  id: string;
  name: string;
  description: string;
  requiredXp: number;
  isPremium: boolean;
  isCustom: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  locations: ManagedUserLocationDataDto[];
}

export interface ManagedUserWordDataDto {
  id: string;
  lessonId: string;
  locationId: string;
  text: string;
  meaning?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserLessonDataDto {
  id: string;
  palaceId: string;
  title: string;
  description?: string | null;
  wordCount: number;
  category?: string | null;
  isCustom?: boolean | null;
  isPremium?: boolean | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  words: ManagedUserWordDataDto[];
}

export interface ManagedUserReviewScheduleDataDto {
  id: string;
  lessonProgressId: string;
  reviewRound: number;
  dueDate: string;
  completed: boolean;
  completedDate?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserLessonProgressDataDto {
  id: string;
  lessonId: string;
  lessonTitle: string;
  firstCompletedDate?: string | null;
  totalReviews: number;
  masteryLevel: string;
  lastReviewDate?: string | null;
  xpEarned: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  reviewSchedules: ManagedUserReviewScheduleDataDto[];
}

export interface ManagedUserBadgeDataDto {
  userBadgeId: string;
  badgeId: string;
  key: string;
  name: string;
  description?: string | null;
  rarity?: string | null;
  earnedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserMilestoneDataDto {
  userMilestoneId: string;
  milestoneId: string;
  key: string;
  title: string;
  description?: string | null;
  conditionType: string;
  conditionValue: number;
  achievedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserXpEventDataDto {
  id: string;
  sourceType: string;
  sourceId?: string | null;
  xpAmount: number;
  clientEventId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserNotificationDataDto {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  isDismissed: boolean;
  readAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserSubscriptionDataDto {
  id: string;
  planId: string;
  provider: string;
  providerReference?: string | null;
  status: string;
  startedAt: string;
  expiresAt?: string | null;
  autoRenew: boolean;
  lastVerifiedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsDataDto {
  lessonsCompleted: number;
  wordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string | null;
  updatedAt: string;
}

export interface ManagedUserDataDto {
  user: ManagedUserDto;
  stats?: UserStatsDataDto | null;
  palaces: ManagedUserPalaceDataDto[];
  lessons: ManagedUserLessonDataDto[];
  progresses: ManagedUserLessonProgressDataDto[];
  badges: ManagedUserBadgeDataDto[];
  milestones: ManagedUserMilestoneDataDto[];
  xpEvents: ManagedUserXpEventDataDto[];
  notifications: ManagedUserNotificationDataDto[];
  subscriptions: ManagedUserSubscriptionDataDto[];
}
