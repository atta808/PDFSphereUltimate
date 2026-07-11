// Re-export the useTheme hook from the theme context
// This allows components to import useTheme from '@hooks/useTheme' instead of directly from '@theme/ThemeContext'
export { useTheme } from '../theme/ThemeContext';