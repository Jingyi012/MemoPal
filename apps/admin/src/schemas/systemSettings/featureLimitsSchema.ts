export interface FeatureLimitsTier {
  free: number;
  premium: number;
}

export interface FeatureLimits {
  customPalaces: FeatureLimitsTier;
  customLessonsPerPalace: FeatureLimitsTier;
  customLocationsPerPalace: FeatureLimitsTier;
  customWordsPerLesson: FeatureLimitsTier;
}

export const FEATURE_LIMITS_SCHEMA = {
  type: "object",
  title: "Feature Limits Configuration",
  description: "Configure feature limits for free and premium users",
  properties: {
    customPalaces: {
      type: "object",
      title: "Custom Palaces",
      description: "Maximum custom palaces a user can create",
      properties: {
        free: {
          type: "number",
          title: "Free Plan",
          minimum: 0,
          default: 0,
        },
        premium: {
          type: "number",
          title: "Premium Plan",
          minimum: 0,
          default: 20,
        },
      },
      required: ["free", "premium"],
    },
    customLessonsPerPalace: {
      type: "object",
      title: "Lessons Per Palace",
      description: "Maximum custom lessons allowed in each palace",
      properties: {
        free: {
          type: "number",
          title: "Free Plan",
          minimum: 0,
          default: 5,
        },
        premium: {
          type: "number",
          title: "Premium Plan",
          minimum: 0,
          default: 50,
        },
      },
      required: ["free", "premium"],
    },
    customLocationsPerPalace: {
      type: "object",
      title: "Locations Per Palace",
      description: "Maximum locations allowed in each palace",
      properties: {
        free: {
          type: "number",
          title: "Free Plan",
          minimum: 0,
          default: 15,
        },
        premium: {
          type: "number",
          title: "Premium Plan",
          minimum: 0,
          default: 100,
        },
      },
      required: ["free", "premium"],
    },
    customWordsPerLesson: {
      type: "object",
      title: "Words Per Lesson",
      description: "Maximum words allowed in each lesson",
      properties: {
        free: {
          type: "number",
          title: "Free Plan",
          minimum: 0,
          default: 25,
        },
        premium: {
          type: "number",
          title: "Premium Plan",
          minimum: 0,
          default: 200,
        },
      },
      required: ["free", "premium"],
    },
  },
  required: [
    "customPalaces",
    "customLessonsPerPalace",
    "customLocationsPerPalace",
    "customWordsPerLesson",
  ],
} as const;

export const FEATURE_LIMITS_DEFAULT: FeatureLimits = {
  customPalaces: {
    free: 0,
    premium: 20,
  },
  customLessonsPerPalace: {
    free: 5,
    premium: 50,
  },
  customLocationsPerPalace: {
    free: 15,
    premium: 100,
  },
  customWordsPerLesson: {
    free: 25,
    premium: 200,
  },
};
