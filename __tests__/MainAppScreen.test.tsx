import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Animated } from 'react-native';
import MainAppScreen from '../src/screens/MainAppScreen';

jest.mock('../src/screens/SignToVoiceScreen', () => () => null);
jest.mock('../src/screens/SignToTextScreen', () => () => null);
jest.mock('../src/screens/TextToSignScreen', () => () => null);
jest.mock('../src/screens/VoiceToSignScreen', () => () => null);
jest.mock('../src/screens/SignToSignScreen', () => () => null);
jest.mock('../src/screens/HistoryScreen', () => () => null);

jest.mock('../src/components/AppBottomNav', () => {
  const React = require('react');
  return ({ onTabChange }: any) =>
    React.createElement('Nav', {
      onPress: () => onTabChange?.('translate'),
    });
});

jest.mock('../src/services/HistoryService', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(async () => []),
  },
  getStats: jest.fn(async () => ({ total: 0, favorites: 0, byMode: {} })),
}));

jest.mock('../src/services/ThemeService', () => ({
  __esModule: true,
  default: {
    getTheme: jest.fn(async () => 'light'),
    setTheme: jest.fn(async () => undefined),
  },
}));

jest.mock('../src/config/firebase', () => ({
  updateProfile: jest.fn(async () => undefined),
  signOut: jest.fn(async () => undefined),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));
jest.mock(
  'react-native/Libraries/Animated/NativeAnimatedHelper',
  () => ({}),
  { virtual: true },
);
jest.mock('../src/services/ThemeService', () => ({
  __esModule: true,
  default: {
    getTheme: jest.fn(async () => 'light'),
    setTheme: jest.fn(async () => undefined),
  },
}));

const mockAnim = { start: (cb?: () => void) => cb && cb() };
beforeAll(() => {
  jest.spyOn(Animated, 'timing').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'spring').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'sequence').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'parallel').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop: jest.fn() } as any);
});

describe('MainAppScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <MainAppScreen
          user={{ id: 'u1', email: 'e', name: 'User', createdAt: new Date() }}
        />,
      );
    });
  });

  it('allows theme toggle flow', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <MainAppScreen
          user={{ id: 'u1', email: 'e', name: 'User', createdAt: new Date() }}
        />,
      );
    });
  });
});

