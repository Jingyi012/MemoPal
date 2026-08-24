export interface GamificationMobileUiConfig {
  homeMissionCardTitle: string;
  homeMissionCardDescription: string;
  missionScreenTitle: string;
  missionScreenDescription: string;
  missionSectionTitle: string;
  missionSectionDescription: string;
  badgeSectionTitle: string;
  milestoneSectionTitle: string;
  milestoneTypeLabels: Record<string, string>;
  homeMissionPreviewCount: number;
}

export const GAMIFICATION_UI_CONFIG_SCHEMA = {
  type: "object",
  title: "Gamification UI Configuration",
  description:
    "Customize UI labels and display settings for the gamification system",
  properties: {
    homeMissionCardTitle: {
      type: "string",
      title: "Mission Card Title",
      description: "Title displayed on home screen mission card",
      minLength: 1,
      maxLength: 50,
    },
    homeMissionCardDescription: {
      type: "string",
      title: "Mission Card Description",
      description: "Description text for mission card on home screen",
      minLength: 1,
      maxLength: 200,
    },
    missionScreenTitle: {
      type: "string",
      title: "Mission Screen Title",
      description: "Main title for the mission screen",
      minLength: 1,
      maxLength: 50,
    },
    missionScreenDescription: {
      type: "string",
      title: "Mission Screen Description",
      description: "Description text for the mission screen",
      minLength: 1,
      maxLength: 200,
    },
    missionSectionTitle: {
      type: "string",
      title: "Mission Section Title",
      description: "Title for the active missions section",
      minLength: 1,
      maxLength: 50,
    },
    missionSectionDescription: {
      type: "string",
      title: "Mission Section Description",
      description: "Description for the active missions section",
      minLength: 1,
      maxLength: 200,
    },
    badgeSectionTitle: {
      type: "string",
      title: "Badges Section Title",
      description: "Title for the badges section",
      minLength: 1,
      maxLength: 50,
    },
    milestoneSectionTitle: {
      type: "string",
      title: "Milestone Section Title",
      description: "Title for the milestones section",
      minLength: 1,
      maxLength: 50,
    },
    milestoneTypeLabels: {
      type: "object",
      title: "Milestone Type Labels",
      description: "Custom labels for different milestone types",
      additionalProperties: {
        type: "string",
        maxLength: 50,
      },
    },
    homeMissionPreviewCount: {
      type: "number",
      title: "Home Mission Preview Count",
      description: "Number of missions to display on home screen preview",
      minimum: 0,
      maximum: 6,
      default: 2,
    },
  },
  required: [
    "homeMissionCardTitle",
    "homeMissionCardDescription",
    "missionScreenTitle",
    "missionScreenDescription",
    "missionSectionTitle",
    "missionSectionDescription",
    "badgeSectionTitle",
    "milestoneSectionTitle",
    "milestoneTypeLabels",
    "homeMissionPreviewCount",
  ],
  additionalProperties: false,
} as const;

export const GAMIFICATION_UI_CONFIG_DEFAULT: GamificationMobileUiConfig = {
  homeMissionCardTitle: "Mission Board",
  homeMissionCardDescription: "Track your current missions and claim rewards.",
  missionScreenTitle: "Mission Board",
  missionScreenDescription: "Complete missions to earn XP and stay consistent.",
  missionSectionTitle: "Active Missions",
  missionSectionDescription: "Complete each mission and claim your XP reward.",
  badgeSectionTitle: "Badges",
  milestoneSectionTitle: "Milestone Journey",
  homeMissionPreviewCount: 2,
  milestoneTypeLabels: {
    reviews_completed: "Review Milestones",
    lessons_completed: "Lesson Milestones",
    words_learned: "Word Milestones",
    streak_days: "Streak Milestones",
    mastered_lessons: "Mastery Milestones",
    level: "Level Milestones",
  },
};
