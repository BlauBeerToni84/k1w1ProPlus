const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.watchFolders = [__dirname];
config.resolver = config.resolver || {};
config.resolver.blockList = [
    /node_modules\/re2\/vendor\/.*/,
    /\.git\/.*/,
    /\.expo\/.*/,
    /android\/.*/,
    /ios\/.*/,
    /__legacy_backup__\/.*/,
    /\.dev_audit\/.*/,
    /\.eas-info\/.*/,
    /\.github\/.*/,
    /dist\/.*/,
    /functions\/.*/,
];
config.maxWorkers = 1;
module.exports = config;