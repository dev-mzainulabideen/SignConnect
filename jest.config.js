module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-firebase|react-native-image-picker|react-native-create-thumbnail|react-native-vision-camera)/)',
  ],
  moduleNameMapper: {
    '^react-native-vector-icons/.*$': '<rootDir>/__mocks__/VectorIconMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
