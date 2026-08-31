import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const configuredVersion = process.env.MEMOPAL_APP_VERSION?.trim();
  const buildEnvironment = process.env.EXPO_PUBLIC_BUILD_ENV?.trim() || 'development';

  return {
    ...config,
    name: config.name ?? 'MemoPal',
    slug: config.slug ?? 'MemoPal',
    version: configuredVersion || config.version || '1.0.0',
    extra: {
      ...config.extra,
      buildEnvironment,
    },
  };
};
