import { adminPaths } from './adminPaths';

export type AdminMenuIcon = 'users' | 'content' | 'config' | 'referral' | 'generic';

export interface AdminMenuItem {
  path: string;
  name: string;
  icon?: AdminMenuIcon;
  routes?: AdminMenuItem[];
}

export const adminMenuItems: AdminMenuItem[] = [
  { path: adminPaths.users, name: 'Users', icon: 'users' },
  {
    path: adminPaths.contentRoot,
    name: 'Content Setup',
    icon: 'content',
    routes: [{ path: adminPaths.palaces, name: 'Palaces' }],
  },
  {
    path: adminPaths.configsRoot,
    name: 'Gamification Config',
    icon: 'config',
    routes: [
      { path: adminPaths.configLimits, name: 'Feature Limits' },
      { path: adminPaths.configXp, name: 'XP Configs' },
      { path: adminPaths.configLevels, name: 'Level Configs' },
      { path: adminPaths.configBadges, name: 'Badge Definitions' },
      { path: adminPaths.configMilestones, name: 'Milestone Definitions' },
      { path: adminPaths.configMissions, name: 'Mission Templates' },
    ],
  },
  {
    path: adminPaths.referralsRoot,
    name: 'Referral Program',
    icon: 'referral',
    routes: [
      { path: adminPaths.referralConfig, name: 'Reward Config' },
      { path: adminPaths.referralUsers, name: 'Referrer Users' },
    ],
  },
  { path: adminPaths.subscriptions, name: 'Subscriptions', icon: 'generic' },
  { path: adminPaths.systemSettings, name: 'System Settings', icon: 'generic' },
];
