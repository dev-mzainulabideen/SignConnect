import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Animated } from 'react-native';
import LoginScreen from '../src/screens/LoginScreen';

jest.mock('../src/config/firebase', () => ({
  signIn: jest.fn(async () => ({ id: 'user1', email: 'test@example.com' })),
  signInWithGoogle: jest.fn(async () => ({ id: 'google1', email: 'g@example.com' })),
  resetPassword: jest.fn(async () => true),
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock(
  'react-native/Libraries/Animated/NativeAnimatedHelper',
  () => ({}),
  { virtual: true },
);

const mockAnim = { start: (cb?: () => void) => cb && cb() };
beforeAll(() => {
  jest.spyOn(Animated, 'timing').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'spring').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'sequence').mockReturnValue(mockAnim as any);
  jest.spyOn(Animated, 'parallel').mockReturnValue(mockAnim as any);
});

describe('LoginScreen', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<LoginScreen />);
    });
  });
});

