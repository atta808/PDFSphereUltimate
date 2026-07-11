import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Layout constants.
 * Provides device dimensions, safe area insets, and breakpoints.
 */
export const Layout = {
  window: {
    width,
    height,
  },
  screen: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 768,
  isLargeDevice: width >= 768,
  isTablet: width >= 768,
  isPhone: width < 768,
  statusBarHeight: Platform.select({
    ios: 44,
    android: StatusBar.currentHeight || 0,
    default: 0,
  }),
  navBarHeight: Platform.select({
    ios: 44,
    android: 56,
    default: 44,
  }),
  tabBarHeight: Platform.select({
    ios: 83,
    android: 56,
    default: 56,
  }),
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    default: 44,
  }),
  // Common layout values
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xLarge: 16,
    '2xl': 24,
    full: 9999,
  },
  elevation: {
    small: 2,
    medium: 4,
    large: 8,
    xLarge: 16,
  },
  maxWidth: 600, // Max content width for readability
} as const;

export type LayoutKey = keyof typeof Layout;