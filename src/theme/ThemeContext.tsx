import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ThemeService, { AppTheme } from '../services/ThemeService';

type Palette = {
  gradientStart: string;
  gradientEnd: string;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  textLight: string;
  border: string;
  pink: string;
  green: string;
  orange: string;
  blue: string;
  purple: string;
  danger: string;
  shadowColor: string;
};

const LightPalette: Palette = {
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  primary: '#6366F1',
  accent: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  cardBackground: '#F1F5F9',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#FFFFFF',
  border: '#E2E8F0',
  pink: '#EC4899',
  green: '#10B981',
  orange: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  danger: '#EF4444',
  shadowColor: 'rgba(0,0,0,0.1)'
};

const DarkPalette: Palette = {
  ...LightPalette,
  background: '#0B1220',
  surface: '#111827',
  cardBackground: '#0F172A',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  shadowColor: 'rgba(0,0,0,0.6)'
};

interface ThemeContextValue {
  theme: AppTheme;
  palette: Palette;
  setTheme: (t: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  palette: LightPalette,
  setTheme: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('light');

  useEffect(() => {
    (async () => {
      const t = await ThemeService.getTheme();
      setThemeState(t);
    })();
  }, []);

  const setTheme = useCallback(async (t: AppTheme) => {
    setThemeState(t);
    await ThemeService.setTheme(t);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    await setTheme(next);
  }, [theme, setTheme]);

  const palette = useMemo(() => (theme === 'dark' ? DarkPalette : LightPalette), [theme]);

  const value = useMemo(() => ({ theme, palette, setTheme, toggleTheme }), [theme, palette, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;


