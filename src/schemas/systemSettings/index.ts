import {
  FEATURE_LIMITS_SCHEMA,
  FEATURE_LIMITS_DEFAULT,
} from "./featureLimitsSchema";
import {
  GAMIFICATION_UI_CONFIG_SCHEMA,
  GAMIFICATION_UI_CONFIG_DEFAULT,
} from "./gamificationUiConfigSchema";
import {
  MISSION_TEMPLATES_CONFIG_SCHEMA,
  MISSION_TEMPLATES_CONFIG_DEFAULT,
} from "./missionTemplatesSchema";
import {
  REFERRAL_PROGRAM_CONFIG_SCHEMA,
  REFERRAL_PROGRAM_CONFIG_DEFAULT,
} from "./referralProgramConfigSchema";

export * from "./gamificationUiConfigSchema";
export * from "./featureLimitsSchema";
export * from "./referralProgramConfigSchema";
export * from "./missionTemplatesSchema";

export interface ConfigSchema {
  key: string;
  title: string;
  schema: any;
  default: any;
}

export const ALL_CONFIG_SCHEMAS: Record<string, ConfigSchema> = {
  gamification_ui: {
    key: "gamification.mobile.ui_config",
    title: "Gamification UI Configuration",
    schema: GAMIFICATION_UI_CONFIG_SCHEMA,
    default: GAMIFICATION_UI_CONFIG_DEFAULT,
  },
  feature_limits: {
    key: "feature_limits",
    title: "Feature Limits",
    schema: FEATURE_LIMITS_SCHEMA,
    default: FEATURE_LIMITS_DEFAULT,
  },
  referral_program: {
    key: "growth.referral.program_config",
    title: "Referral Program Configuration",
    schema: REFERRAL_PROGRAM_CONFIG_SCHEMA,
    default: REFERRAL_PROGRAM_CONFIG_DEFAULT,
  },
  mission_templates: {
    key: "gamification.missions.templates",
    title: "Mission Templates",
    schema: MISSION_TEMPLATES_CONFIG_SCHEMA,
    default: MISSION_TEMPLATES_CONFIG_DEFAULT,
  },
};
