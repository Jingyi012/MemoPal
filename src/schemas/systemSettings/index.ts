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
import {
  HELP_FAQ_CONFIG_DEFAULT,
  HELP_FAQ_CONFIG_SCHEMA,
} from "./helpFaqConfigSchema";
import {
  PRIVACY_POLICY_CONFIG_DEFAULT,
  PRIVACY_POLICY_CONFIG_SCHEMA,
} from "./privacyPolicyConfigSchema";
import {
  PREMIUM_SUBSCRIPTION_CONFIG_DEFAULT,
  PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA,
} from "./premiumSubscriptionConfigSchema";

export * from "./gamificationUiConfigSchema";
export * from "./featureLimitsSchema";
export * from "./referralProgramConfigSchema";
export * from "./authLoginMethodsSchema";
export * from "./xpConfigsSchema";
export * from "./levelConfigsSchema";
export * from "./helpFaqConfigSchema";
export * from "./privacyPolicyConfigSchema";
export * from "./premiumSubscriptionConfigSchema";

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
  help_faq: {
    key: "support.help_faq",
    title: "Help & FAQ Configuration",
    schema: HELP_FAQ_CONFIG_SCHEMA,
    default: HELP_FAQ_CONFIG_DEFAULT,
  },
  privacy_policy: {
    key: "support.privacy_policy",
    title: "Privacy Policy Configuration",
    schema: PRIVACY_POLICY_CONFIG_SCHEMA,
    default: PRIVACY_POLICY_CONFIG_DEFAULT,
  },
  premium_subscription: {
    key: "premium.subscription",
    title: "Premium Subscription Configuration",
    schema: PREMIUM_SUBSCRIPTION_CONFIG_SCHEMA,
    default: PREMIUM_SUBSCRIPTION_CONFIG_DEFAULT,
  },
};
