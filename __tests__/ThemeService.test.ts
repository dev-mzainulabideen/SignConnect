import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemeService from '../src/services/ThemeService';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    __store: store,
  };
});

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage> & {
  __store: Record<string, string>;
};

beforeEach(() => {
  Object.keys(mockStorage.__store).forEach(k => delete mockStorage.__store[k]);
  jest.clearAllMocks();
});

describe('ThemeService', () => {
  it('returns light by default when nothing is stored', async () => {
    const theme = await ThemeService.getTheme();
    expect(theme).toBe('light');
  });

  it('persists and retrieves a valid theme', async () => {
    await ThemeService.setTheme('dark');
    const theme = await ThemeService.getTheme();

    expect(theme).toBe('dark');
    expect(mockStorage.setItem).toHaveBeenCalledWith('app:theme', 'dark');
  });

  it('falls back to light when stored value is invalid', async () => {
    mockStorage.__store['app:theme'] = 'unknown' as any;
    const theme = await ThemeService.getTheme();
    expect(theme).toBe('light');
  });
});

