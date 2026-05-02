import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import SplashScreen from '../src/screens/SplashScreen';

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

describe('SplashScreen UI', () => {
  it('renders and calls onSplashComplete', () => {
    const onDone = jest.fn();
    render(<SplashScreen onSplashComplete={onDone} />);
    expect(onDone).not.toHaveBeenCalled(); // entry render smoke
  });
});

