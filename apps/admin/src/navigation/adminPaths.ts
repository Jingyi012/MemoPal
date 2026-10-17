export const adminPaths = {
  root: '/admin',
  login: '/login',
  forbidden: '/forbidden',

  dashboard: '/admin/dashboard',

  users: '/admin/users',
  communityMemorySets: '/admin/community-memory-sets',
  contentRoot: '/admin/content',
  memoryCollections: '/admin/content/memory-collections',
  memoryCollectionLessons: (collectionId: string) => `/admin/content/memory-collections/${collectionId}/lessons`,
  palaceScenes: '/admin/content/palace-scenes',
  palaceSceneEditor: (sceneId: string) => `/admin/content/palace-scenes/${sceneId}`,
  predefinedMemoryLessons: '/admin/content/predefined-memory-lessons',
  predefinedMemoryLessonCategories: '/admin/content/predefined-memory-lesson-categories',

  configsRoot: '/admin/configs',
  configLimits: '/admin/configs/limits',
  configXp: '/admin/configs/xp',
  configLevels: '/admin/configs/levels',
  configMilestones: '/admin/configs/milestones',
  configAvatars: '/admin/configs/avatars',
  configAppearance: '/admin/configs/appearance',

  referralsRoot: '/admin/referrals',
  referralConfig: '/admin/referrals/config',
  referralUsers: '/admin/referrals/users',

  subscriptions: '/admin/subscriptions',
  aiCredits: '/admin/ai-credits',
  systemSettings: '/admin/system-settings',
} as const;
