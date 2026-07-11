import { Theme } from './ThemeContext';
import { LightThemeColors } from './colors';
import { createTypography } from './typography';
import { createSpacing } from './spacing';

/**
 * Light theme configuration.
 */
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  colors: LightThemeColors,
  typography: createTypography('System'),
  spacing: createSpacing(1),
  isDark: false,
};