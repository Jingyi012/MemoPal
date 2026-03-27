export interface AuthLoginMethodsConfig {
  emailPassword: boolean;
  google: boolean;
  facebook: boolean;
}

export const AUTH_LOGIN_METHODS_SCHEMA = {
  type: "object",
  title: "Authentication Login Methods",
  description: "Enable or disable each sign-in method exposed to clients",
  properties: {
    emailPassword: {
      type: "boolean",
      title: "Email + Password",
      description: "Allow users to sign in and register with email/password",
      default: true,
    },
    google: {
      type: "boolean",
      title: "Google",
      description: "Allow users to sign in with Google",
      default: true,
    },
    facebook: {
      type: "boolean",
      title: "Facebook",
      description: "Allow users to sign in with Facebook",
      default: false,
    },
  },
  required: ["emailPassword", "google", "facebook"],
  additionalProperties: false,
} as const;

export const AUTH_LOGIN_METHODS_DEFAULT: AuthLoginMethodsConfig = {
  emailPassword: true,
  google: true,
  facebook: false,
};
