import {
  FEATURE_LIMITS_SCHEMA,
  FEATURE_LIMITS_DEFAULT,
} from "./featureLimitsSchema";
import {
  GAMIFICATION_UI_CONFIG_SCHEMA,
  GAMIFICATION_UI_CONFIG_DEFAULT,
} from "./gamificationUiConfigSchema";
import {
  REFERRAL_PROGRAM_CONFIG_SCHEMA,
  REFERRAL_PROGRAM_CONFIG_DEFAULT,
} from "./referralProgramConfigSchema";
import {
  AUTH_LOGIN_METHODS_SCHEMA,
  AUTH_LOGIN_METHODS_DEFAULT,
} from "./authLoginMethodsSchema";
import { XP_CONFIGS_DEFAULT, XP_CONFIGS_SCHEMA } from "./xpConfigsSchema";
import {
  LEVEL_CONFIGS_DEFAULT,
  LEVEL_CONFIGS_SCHEMA,
} from "./levelConfigsSchema";

export * from "./gamificationUiConfigSchema";
export * from "./featureLimitsSchema";
export * from "./referralProgramConfigSchema";
export * from "./authLoginMethodsSchema";
export * from "./xpConfigsSchema";
export * from "./levelConfigsSchema";

export interface ConfigSchema {
  key: string;
  title: string;
  schema: Record<string, unknown>;
  default: unknown;
}

export const ALL_CONFIG_SCHEMAS: Record<string, ConfigSchema> = {
  gamification_ui: {
    key: "gamification.mobile.ui_config",
    title: "Gamification UI Configuration",
    schema: GAMIFICATION_UI_CONFIG_SCHEMA,
    default: GAMIFICATION_UI_CONFIG_DEFAULT,
  },
  feature_limits: {
    key: "feature.limits",
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
  auth_login_methods: {
    key: "auth.login_methods",
    title: "Authentication Login Methods",
    schema: AUTH_LOGIN_METHODS_SCHEMA,
    default: AUTH_LOGIN_METHODS_DEFAULT,
  },
  xp_configs: {
    key: "xp.configs",
    title: "XP Configurations",
    schema: XP_CONFIGS_SCHEMA,
    default: XP_CONFIGS_DEFAULT,
  },
  level_configs: {
    key: "level.configs",
    title: "Level Configurations",
    schema: LEVEL_CONFIGS_SCHEMA,
    default: LEVEL_CONFIGS_DEFAULT,
  },
};
