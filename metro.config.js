const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Keep this file as close as possible to the template config to avoid
 * internal Metro errors. We only extend the default asset extensions so
 * that Metro can load our ML model and text assets.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const baseConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Extend the default asset extensions so we can bundle .onnx/.tflite/.txt/.mp4
    assetExts: [...baseConfig.resolver.assetExts, 'onnx', 'tflite', 'txt', 'mp4'],
  },
};

module.exports = mergeConfig(baseConfig, config);
