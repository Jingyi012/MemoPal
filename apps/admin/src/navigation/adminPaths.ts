export const adminPaths = {
  root: '/admin',
  login: '/login',
  forbidden: '/forbidden',

  users: '/admin/users',
  contentRoot: '/admin/content',
  palaceScenes: '/admin/content/palace-scenes',
  predefinedMemoryLessons: '/admin/content/predefined-memory-lessons',
  predefinedMemoryLessonCategories: '/admin/content/predefined-memory-lesson-categories',

  configsRoot: '/admin/configs',
  configLimits: '/admin/configs/limits',
  configXp: '/admin/configs/xp',
  configLevels: '/admin/configs/levels',
  configMilestones: '/admin/configs/milestones',

  referralsRoot: '/admin/referrals',
  referralConfig: '/admin/referrals/config',
  referralUsers: '/admin/referrals/users',

  subscriptions: '/admin/subscriptions',
  systemSettings: '/admin/system-settings',
} as const;
