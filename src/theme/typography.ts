import { TextStyle } from 'react-native';
import { Typography as TypographyConstants } from '../constants/typography';

export interface TypographyTheme {
  heading1: TextStyle;
  heading2: TextStyle;
  heading3: TextStyle;
  heading4: TextStyle;
  heading5: TextStyle;
  heading6: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  caption: TextStyle;
  overline: TextStyle;
  button: TextStyle;
  label: TextStyle;
}

/**
 * Creates typography styles based on the theme.
 * This function allows for dynamic font scaling and accessibility.
 */
export const createTypography = (fontFamily: string = 'System'): TypographyTheme => {
  const { fontSize, fontWeight, lineHeight, letterSpacing } = TypographyConstants;

  return {
    heading1: {
      fontSize: fontSize['4xl'],
      fontWeight: fontWeight.bold,
      lineHeight: fontSize['4xl'] * lineHeight.tight,
      letterSpacing: letterSpacing.tight,
      fontFamily,
    },
    heading2: {
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.bold,
      lineHeight: fontSize['3xl'] * lineHeight.tight,
      letterSpacing: letterSpacing.tight,
      fontFamily,
    },
    heading3: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.semiBold,
      lineHeight: fontSize['2xl'] * lineHeight.tight,
      letterSpacing: letterSpacing.tight,
      fontFamily,
    },
    heading4: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semiBold,
      lineHeight: fontSize.xl * lineHeight.tight,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
    heading5: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semiBold,
      lineHeight: fontSize.lg * lineHeight.normal,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
    heading6: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      lineHeight: fontSize.base * lineHeight.normal,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
    body1: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.normal,
      lineHeight: fontSize.base * lineHeight.normal,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
    body2: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.normal,
      lineHeight: fontSize.md * lineHeight.normal,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
    caption: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.normal,
      lineHeight: fontSize.sm * lineHeight.normal,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
    overline: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      lineHeight: fontSize.xs * lineHeight.normal,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase' as const,
      fontFamily,
    },
    button: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      lineHeight: fontSize.md * lineHeight.normal,
      letterSpacing: letterSpacing.wide,
      fontFamily,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      lineHeight: fontSize.sm * lineHeight.normal,
      letterSpacing: letterSpacing.normal,
      fontFamily,
    },
  };
};