const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
const exts = new Set([...(config.resolver.sourceExts || []), 'cjs']);
config.resolver.sourceExts = Array.from(exts);

// Nur die node_modules aus dem Projekt verwenden
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Safety-Pins auf die lokalen Firebase-Pakete
const nm = p => path.resolve(__dirname, 'node_modules', p);
config.resolver.extraNodeModules = {
  firebase: nm('firebase'),
  '@firebase/app': nm('@firebase/app'),
  '@firebase/auth': nm('@firebase/auth'),
  '@firebase/util': nm('@firebase/util'),
  '@firebase/component': nm('@firebase/component'),
};
module.exports = config;
