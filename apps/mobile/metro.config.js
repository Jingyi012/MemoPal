const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// set project root to this repo root
const projectRoot = __dirname;

// get default config
const config = getDefaultConfig(projectRoot);
// The diagram protocol is shared with Admin; Metro must watch its source outside this app.
config.watchFolders = [...new Set([...(config.watchFolders ?? []), path.resolve(projectRoot, '../../shared')])];

// set your alias
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'), // point "@" to src
  react: path.resolve(projectRoot, 'node_modules', 'react'),
  'react-dom': path.resolve(projectRoot, 'node_modules', 'react-dom'),
};

// wrap with NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
