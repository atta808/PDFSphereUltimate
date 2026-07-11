/**
 * Theme module exports
 * Central entry point for all theme-related components, hooks, and utilities.
 */

// Theme context & hooks
export { ThemeProvider, useTheme, ThemeContext } from './ThemeContext';
export type { Theme, ThemeMode } from './ThemeContext';

// Theme color definitions
export { LightThemeColors, DarkThemeColors } from './colors';
export type { ThemeColors } from './colors';

// Typography
export { createTypography } from './typography';
export type { TypographyTheme } from './typography';

// Spacing
export { createSpacing } from './spacing';
export type { SpacingTheme } from './spacing';

// Pre-built themes
export { lightTheme } from './lightTheme';
export { darkTheme } from './darkTheme';

// Global styles
export { globalStyles } from './globalStyles';

// Re-export useTheme from hooks (for convenience)
export { useTheme as useThemeHook } from '../hooks/useTheme';