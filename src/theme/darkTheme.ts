import { Theme } from './ThemeContext';
import { DarkThemeColors } from './colors';
import { createTypography } from './typography';
import { createSpacing } from './spacing';

/**
 * Dark theme configuration.
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: DarkThemeColors,
  typography: createTypography('System'),
  spacing: createSpacing(1),
  isDark: true,
};