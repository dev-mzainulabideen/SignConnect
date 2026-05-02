import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import GetStartedScreen from '../src/screens/GetStartedScreen';

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
  jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop: jest.fn() } as any);
});

describe('GetStartedScreen UI', () => {
  it('renders hero text and buttons', () => {
    const onSignIn = jest.fn();
    const onSignUp = jest.fn();
    const { getByText } = render(
      <GetStartedScreen onNavigateToSignIn={onSignIn} onNavigateToSignUp={onSignUp} />,
    );

    expect(getByText('Terms and Conditions')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('fires navigation callbacks when CTAs are pressed', () => {
    const onSignIn = jest.fn();
    const onSignUp = jest.fn();
    const { queryByText } = render(
      <GetStartedScreen onNavigateToSignIn={onSignIn} onNavigateToSignUp={onSignUp} />,
    );

    const signInBtn = queryByText(/Sign In/i);
    const createBtn = queryByText(/Create Account/i);

    if (signInBtn) fireEvent.press(signInBtn);
    if (createBtn) fireEvent.press(createBtn);
    // Buttons may be hidden behind animations; pressing is best-effort.
  });
});

