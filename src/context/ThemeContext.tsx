import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  secondary: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899',
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const darkColors = {
  primary: {
    50: '#1E3A8A',
    100: '#1E40AF',
    200: '#1D4ED8',
    300: '#2563EB',
    400: '#3B82F6',
    500: '#60A5FA',
    600: '#93C5FD',
    700: '#BFDBFE',
    800: '#DBEAFE',
    900: '#EFF6FF',
  },
  secondary: {
    50: '#831843',
    100: '#9D174D',
    200: '#BE185D',
    300: '#DB2777',
    400: '#EC4899',
    500: '#F472B6',
    600: '#F9A8D4',
    700: '#FBCFE8',
    800: '#FCE7F3',
    900: '#FDF2F8',
  },
  gray: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#F9FAFB',
  },
  white: '#111827',
  black: '#FFFFFF',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  useEffect(() => {
    loadThemeMode();
  }, []);

  useEffect(() => {
    if (themeMode === 'auto') {
      setTheme(systemColorScheme || 'light');
    } else {
      setTheme(themeMode);
    }
  }, [themeMode, systemColorScheme]);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
