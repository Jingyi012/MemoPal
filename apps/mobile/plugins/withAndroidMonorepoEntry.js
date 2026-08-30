const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo's generated React Native Gradle file turns the hoisted Expo Router
 * entry into a path relative to android/app. `export:embed` runs from the
 * mobile workspace, so that path is resolved from the wrong directory in a
 * monorepo. Keep the normal entry for task validation and append an absolute
 * final argument for Expo's bundler.
 */
module.exports = function withAndroidMonorepoEntry(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      return modConfig;
    }

    let contents = modConfig.modResults.contents;
    const entryFileLine = /^\s*entryFile\s*=.*\r?\n/m;
    const projectRootLine = /^(def projectRoot = .*\r?\n)/m;
    const bundleCommandLine = /^(\s*bundleCommand = "export:embed"\r?\n)/m;

    contents = contents.replace(entryFileLine, '');

    if (!contents.includes('def expoEntryFile =')) {
      contents = contents.replace(
        projectRootLine,
        '$1def expoEntryFile = ["node", "--print", "require.resolve(\'expo-router/entry\')"].execute(null, rootDir).text.trim()\n',
      );
    }

    if (!contents.includes('extraPackagerArgs = ["--entry-file", expoEntryFile]')) {
      contents = contents.replace(
        bundleCommandLine,
        '$1    extraPackagerArgs = ["--entry-file", expoEntryFile]\n',
      );
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });
};
