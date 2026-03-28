export const adminPaths = {
  root: '/admin',
  login: '/login',
  forbidden: '/forbidden',

  users: '/admin/users',
  userData: (userId: string) => `/admin/users/${userId}/data`,
  userDataLessonWords: (userId: string, palaceId: string, lessonId: string) =>
    `/admin/users/${userId}/data/palaces/${palaceId}/lessons/${lessonId}`,

  contentRoot: '/admin/content',
  palaces: '/admin/content/palaces',
  palaceDetails: (palaceId: string) => `/admin/content/palaces/${palaceId}`,
  lessonWords: (palaceId: string, lessonId: string) =>
    `/admin/content/palaces/${palaceId}/lessons/${lessonId}`,

  configsRoot: '/admin/configs',
  configLimits: '/admin/configs/limits',
  configXp: '/admin/configs/xp',
  configLevels: '/admin/configs/levels',
  configBadges: '/admin/configs/badges',
  configMilestones: '/admin/configs/milestones',
  configMissions: '/admin/configs/missions',

  referralsRoot: '/admin/referrals',
  referralConfig: '/admin/referrals/config',
  referralUsers: '/admin/referrals/users',

  subscriptions: '/admin/subscriptions',
  systemSettings: '/admin/system-settings',
} as const;

export const adminRouteParams = {
  palaceId: ':palaceId',
  lessonId: ':lessonId',
} as const;
