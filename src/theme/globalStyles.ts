import { StyleSheet } from 'react-native';
import { Theme } from './ThemeContext';

export const globalStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  text: {
    color: theme.colors.text,
  },
});
