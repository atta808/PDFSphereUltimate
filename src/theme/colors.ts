/**
 * Theme color definitions.
 * Provides semantic color names that map to the palette.
 */
import { Colors } from '../constants/colors';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundElevated: string;
  backgroundInverse: string;

  // Surfaces
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  surfaceInverse: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textLink: string;
  textPlaceholder: string;

  // Borders
  border: string;
  borderLight: string;
  borderHeavy: string;

  // Primary brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySurface: string;
  primaryText: string;

  // Secondary brand
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Semantic
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;

  // State
  disabled: string;
  overlay: string;
  shadow: string;

  // Misc
  card: string;
  cardElevated: string;
  divider: string;
  icon: string;
  iconSecondary: string;
  badge: string;
  badgeText: string;
}

export const LightThemeColors: ThemeColors = {
  background: Colors.white,
  backgroundSecondary: Colors.neutral[50],
  backgroundElevated: Colors.white,
  backgroundInverse: Colors.neutral[900],

  surface: Colors.white,
  surfaceSecondary: Colors.neutral[50],
  surfaceElevated: Colors.white,
  surfaceInverse: Colors.neutral[900],

  text: Colors.neutral[900],
  textSecondary: Colors.neutral[700],
  textTertiary: Colors.neutral[500],
  textInverse: Colors.white,
  textLink: Colors.primary[600],
  textPlaceholder: Colors.neutral[400],

  border: Colors.neutral[300],
  borderLight: Colors.neutral[200],
  borderHeavy: Colors.neutral[500],

  primary: Colors.primary[500],
  primaryLight: Colors.primary[300],
  primaryDark: Colors.primary[700],
  primarySurface: Colors.primary[50],
  primaryText: Colors.white,

  secondary: Colors.secondary[500],
  secondaryLight: Colors.secondary[300],
  secondaryDark: Colors.secondary[700],

  success: Colors.success[500],
  successLight: Colors.success[300],
  successDark: Colors.success[700],
  warning: Colors.warning[500],
  warningLight: Colors.warning[300],
  warningDark: Colors.warning[700],
  error: Colors.error[500],
  errorLight: Colors.error[300],
  errorDark: Colors.error[700],

  disabled: Colors.neutral[400],
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',

  card: Colors.white,
  cardElevated: Colors.white,
  divider: Colors.neutral[200],
  icon: Colors.neutral[700],
  iconSecondary: Colors.neutral[500],
  badge: Colors.primary[500],
  badgeText: Colors.white,
};

export const DarkThemeColors: ThemeColors = {
  background: Colors.neutral[900],
  backgroundSecondary: Colors.neutral[800],
  backgroundElevated: Colors.neutral[800],
  backgroundInverse: Colors.white,

  surface: Colors.neutral[800],
  surfaceSecondary: Colors.neutral[700],
  surfaceElevated: Colors.neutral[700],
  surfaceInverse: Colors.white,

  text: Colors.white,
  textSecondary: Colors.neutral[300],
  textTertiary: Colors.neutral[500],
  textInverse: Colors.neutral[900],
  textLink: Colors.primary[400],
  textPlaceholder: Colors.neutral[500],

  border: Colors.neutral[700],
  borderLight: Colors.neutral[600],
  borderHeavy: Colors.neutral[400],

  primary: Colors.primary[400],
  primaryLight: Colors.primary[300],
  primaryDark: Colors.primary[600],
  primarySurface: Colors.primary[900],
  primaryText: Colors.white,

  secondary: Colors.secondary[400],
  secondaryLight: Colors.secondary[300],
  secondaryDark: Colors.secondary[600],

  success: Colors.success[400],
  successLight: Colors.success[300],
  successDark: Colors.success[600],
  warning: Colors.warning[400],
  warningLight: Colors.warning[300],
  warningDark: Colors.warning[600],
  error: Colors.error[400],
  errorLight: Colors.error[300],
  errorDark: Colors.error[600],

  disabled: Colors.neutral[600],
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',

  card: Colors.neutral[800],
  cardElevated: Colors.neutral[700],
  divider: Colors.neutral[600],
  icon: Colors.neutral[300],
  iconSecondary: Colors.neutral[500],
  badge: Colors.primary[400],
  badgeText: Colors.white,
};