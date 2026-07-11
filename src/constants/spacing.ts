/**
 * Spacing constants.
 * Used for margins, paddings, gaps, and layout spacing.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 64,
  // Aliases for common use cases
  margin: {
    small: 8,
    medium: 16,
    large: 24,
    xLarge: 32,
  },
  padding: {
    small: 8,
    medium: 16,
    large: 24,
    xLarge: 32,
  },
  gap: {
    small: 8,
    medium: 16,
    large: 24,
    xLarge: 32,
  },
} as const;

export type SpacingKey = keyof typeof Spacing;