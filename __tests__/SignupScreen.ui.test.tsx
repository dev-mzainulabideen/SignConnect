import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import SignupScreen from '../src/screens/SignupScreen';

jest.mock('../src/config/firebase', () => ({
  signUp: jest.fn(async () => ({ id: 'u1', email: 'test@example.com', name: 'User', createdAt: new Date() })),
  signInWithGoogle: jest.fn(async () => ({ id: 'g1', email: 'g@example.com', name: 'G', createdAt: new Date() })),
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

describe('SignupScreen UI', () => {
  it('opens the signup modal and shows form fields', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<SignupScreen />);

    const cta = queryByText(/Fill Your Details/i) || queryByText(/Enter Your Credentials/i);
    if (cta) {
      fireEvent.press(cta);
    }
    expect(getByText('Registration Form')).toBeTruthy();
    expect(getByPlaceholderText(/Enter your full name/i)).toBeTruthy();
    expect(getByPlaceholderText(/Enter your email address/i)).toBeTruthy();
  });
});

