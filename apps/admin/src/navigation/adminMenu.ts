import { adminPaths } from "./adminPaths";

export type AdminMenuIcon =
  "dashboard" | "users" | "content" | "learning" | "config" | "referral" | "moderation" | "generic";

export interface AdminMenuItem {
  path: string;
  name: string;
  icon?: AdminMenuIcon;
  routes?: AdminMenuItem[];
}

export const learningStudioMenuItem: AdminMenuItem = {
  path: adminPaths.education,
  name: "Learning Studio",
  icon: "learning",
  routes: [
    { path: adminPaths.educationHome, name: "Overview" },
    { path: adminPaths.educationClassrooms, name: "Classrooms" },
    { path: adminPaths.educationCourses, name: "Courses" },
    { path: `${adminPaths.education}/guardians`, name: "Guardian relationships" },
    { path: adminPaths.educationFamilyAssignments, name: "Family practice" },
  ],
};

export const adminMenuItems: AdminMenuItem[] = [
  { path: adminPaths.dashboard, name: "Overview", icon: "dashboard" },
  { path: adminPaths.users, name: "Users", icon: "users" },
  { path: adminPaths.communityMemorySets, name: "Community Memory Sets", icon: "moderation" },
  { path: adminPaths.educationCourseReports, name: "Public Learning Reports", icon: "moderation" },
  learningStudioMenuItem,
  {
    path: adminPaths.contentRoot,
    name: "Content Studio",
    icon: "content",
    routes: [
      { path: adminPaths.memoryCollections, name: "Content library" },
      { path: adminPaths.palaceScenes, name: "Palace scenes" },
      {
        path: adminPaths.predefinedMemoryLessonCategories,
        name: "Categories",
      },
    ],
  },
  {
    path: adminPaths.configsRoot,
    name: "Gamification Config",
    icon: "config",
    routes: [
      { path: adminPaths.configLimits, name: "Feature Limits" },
      { path: adminPaths.configXp, name: "XP Configs" },
      { path: adminPaths.configLevels, name: "Level Configs" },
      { path: adminPaths.configMilestones, name: "Milestone Definitions" },
      { path: adminPaths.configAvatars, name: "Avatar Gallery" },
      { path: adminPaths.configAppearance, name: "Appearance Studio" },
      { path: adminPaths.configLeaderboards, name: "Leaderboards" },
    ],
  },
  {
    path: adminPaths.referralsRoot,
    name: "Referral Program",
    icon: "referral",
    routes: [
      { path: adminPaths.referralConfig, name: "Reward Config" },
      { path: adminPaths.referralUsers, name: "Referrer Users" },
    ],
  },
  { path: adminPaths.subscriptions, name: "Subscriptions", icon: "generic" },
  { path: adminPaths.aiCredits, name: "AI Credits", icon: "generic" },
  { path: adminPaths.systemSettings, name: "System Settings", icon: "generic" },
];
