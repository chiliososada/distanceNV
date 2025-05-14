// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { homedir } = require('os');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
/*
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'firebase/persistence': __dirname + '/node_modules/firebase/node_modules/@firebase/auth/dist/rn'
}
    */

module.exports = config;
