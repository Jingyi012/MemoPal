export const adminPaths = {
  root: '/admin',
  login: '/login',
  forbidden: '/forbidden',

  users: '/admin/users',
  contentRoot: '/admin/content',
  palaceScenes: '/admin/content/palace-scenes',

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
