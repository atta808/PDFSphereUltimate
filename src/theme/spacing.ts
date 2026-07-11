import { Spacing as SpacingConstants } from '../constants/spacing';

export interface SpacingTheme {
  xs: number;
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
  '6xl': number;
}

/**
 * Creates spacing theme.
 * Can be extended to support platform-specific scaling.
 */
export const createSpacing = (scale: number = 1): SpacingTheme => {
  const { xs, sm, md, base, lg, xl, '2xl': xxl, '3xl': xxxl, '4xl': xxxxl, '5xl': xxxxxl, '6xl': xxxxxxl } = SpacingConstants;

  return {
    xs: xs * scale,
    sm: sm * scale,
    md: md * scale,
    base: base * scale,
    lg: lg * scale,
    xl: xl * scale,
    '2xl': xxl * scale,
    '3xl': xxxl * scale,
    '4xl': xxxxl * scale,
    '5xl': xxxxxl * scale,
    '6xl': xxxxxxl * scale,
  };
};