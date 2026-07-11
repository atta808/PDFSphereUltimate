/**
 * Typography constants.
 * Defines font families, sizes, weights, and line heights.
 */
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
    italic: 'System',
    // For custom fonts, you would reference the font family name:
    // 'Inter-Regular', 'Inter-Medium', 'Inter-Bold', etc.
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
  fontWeight: {
    thin: '100',
    extraLight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  } as const,
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2.0,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 1.5,
  },
} as const;

export type FontSizeKey = keyof typeof Typography.fontSize;
export type FontWeightKey = keyof typeof Typography.fontWeight;