import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { StorageKeys } from '../constants/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  id: 'light' | 'dark';
  name: string;
  colors: import('./colors').ThemeColors;
  typography: import('./typography').TypographyTheme;
  spacing: import('./spacing').SpacingTheme;
  isDark: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>(lightTheme);

  // Load stored theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(StorageKeys.THEME);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setMode(stored);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  // Update theme when mode or system scheme changes
  useEffect(() => {
    let activeTheme: Theme;
    if (mode === 'system') {
      activeTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
    } else if (mode === 'dark') {
      activeTheme = darkTheme;
    } else {
      activeTheme = lightTheme;
    }
    setTheme(activeTheme);
  }, [mode, systemColorScheme]);

  const setThemeMode = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(StorageKeys.THEME, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    await setThemeMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setTheme: setThemeMode,
        toggleTheme,
        isDark: theme.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};