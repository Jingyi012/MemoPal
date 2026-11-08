import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const configuredVersion = process.env.MEMOPAL_APP_VERSION?.trim();
  const compactApk = process.env.MEMOPAL_COMPACT_APK === '1';
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
    const options = plugin[1] ?? {};
    return [
      plugin[0],
      { ...options, android: { ...options.android, useLegacyPackaging: compactApk } },
    ] as [string, Record<string, unknown>];
  });
  const buildEnvironment = process.env.EXPO_PUBLIC_BUILD_ENV?.trim() || 'development';

  return {
    ...config,
    plugins,
    name: config.name ?? 'MemoPal',
    slug: config.slug ?? 'MemoPal',
    version: configuredVersion || config.version || '1.0.0',
    extra: {
      ...config.extra,
      buildEnvironment,
    },
  };
};
