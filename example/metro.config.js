const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const sdkRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(sdkRoot, '..', '..');

// Watch the SDK source for live changes
config.watchFolders = [sdkRoot];

// Packages that MUST resolve from the example's node_modules
// to avoid duplicate instances (especially React)
const sharedDeps = [
  'react',
  'react-native',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@react-native-async-storage/async-storage',
  'react-native-safe-area-context',
  'react-native-screens',
  'expo-router',
  'expo-status-bar',
];

const exampleNodeModules = path.resolve(__dirname, 'node_modules');

// Force shared deps to resolve from example's node_modules
config.resolver.extraNodeModules = {};
for (const dep of sharedDeps) {
  config.resolver.extraNodeModules[dep] = path.resolve(exampleNodeModules, dep);
}

// Block the SDK's node_modules for shared packages
// This prevents Metro from finding a second copy of React
config.resolver.blockList = [
  new RegExp(
    path.resolve(sdkRoot, 'node_modules', '(react|react-native|@react-native-async-storage)')
      .replace(/[/\\]/g, '[/\\\\]')
  ),
];

// Tell Metro where to look for modules
config.resolver.nodeModulesPaths = [
  exampleNodeModules,
];

module.exports = config;
