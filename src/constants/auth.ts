import { User } from '@/types/users';

export const AUTH_STORAGE_KEY = '@memopal_auth_user';
export const AUTH_TOKEN_KEY = '@memopal_auth_token';

export const MOCK_USER: User = {
  id: 'user-1',
  displayName: 'Jing Yi',
  email: 'jingyi@test.com',
  isPremium: false,
  avatarUrl: undefined,
  level: 1,
  totalXp: 10,
  stats: {
    currentStreak: 5,
    longestStreak: 6,
    lessonsCompleted: 10,
    wordsLearned: 50,
  },
};