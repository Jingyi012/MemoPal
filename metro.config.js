const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// set project root to this repo root
const projectRoot = __dirname;

// get default config
const config = getDefaultConfig(projectRoot);

// set your alias
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'), // point "@" to src
};

// watch the root folder
config.watchFolders = [projectRoot];

config.resolver.sourceExts.push('sql');

// wrap with NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
