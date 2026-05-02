import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'light' | 'dark';

const THEME_KEY = 'app:theme';

async function getTheme(): Promise<AppTheme> {
  try {
    const v = await AsyncStorage.getItem(THEME_KEY);
    return (v === 'dark' || v === 'light') ? (v as AppTheme) : 'light';
  } catch {
    return 'light';
  }
}

async function setTheme(theme: AppTheme): Promise<void> {
  try { await AsyncStorage.setItem(THEME_KEY, theme); } catch {}
}

const ThemeService = {
  getTheme,
  setTheme,
};

export default ThemeService;


