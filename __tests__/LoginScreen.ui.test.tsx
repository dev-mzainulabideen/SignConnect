import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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

describe('LoginScreen UI', () => {
  it('shows header and CTA text', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Enter Your Credentials')).toBeTruthy();
  });

  it('opens the credential modal when CTA is pressed', () => {
    const { getByText, queryByText } = render(<LoginScreen />);

    expect(queryByText('Sign In to Your Account')).toBeNull();

    fireEvent.press(getByText('Enter Your Credentials'));

    expect(getByText('Sign In to Your Account')).toBeTruthy();
    expect(getByText('Email Address')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
  });
});

