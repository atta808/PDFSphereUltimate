import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const { width } = Dimensions.get('window');

export interface SkeletonLoaderProps {
  /** Width of the skeleton (default: '100%') */
  width?: import('react-native').DimensionValue;
  /** Height of the skeleton (default: 20) */
  height?: number;
  /** Border radius (default: 8) */
  borderRadius?: number;
  /** Custom styles */
  style?: ViewStyle;
  /** Animation duration in ms (default: 800) */
  animationDuration?: number;
}

/**
 * A single skeleton loader placeholder.
 * Used for loading states before content is available.
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  animationDuration = 800,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.isDark ? theme.colors.surfaceSecondary : theme.colors.borderLight
        },
        style,
      ]}
    />
  );
};

export interface SkeletonListProps {
  /** Number of items to show (default: 5) */
  count?: number;
  /** Whether to show as cards with rounded corners (default: true) */
  cardStyle?: boolean;
  /** Additional styles for each item */
  itemStyle?: ViewStyle;
}

/**
 * A list of skeleton loaders for list loading states.
 * Supports both card-style and standard list items.
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  cardStyle = true,
  itemStyle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            cardStyle && {
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 10,
              elevation: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 2,
            },
            itemStyle,
          ]}
        >
          {cardStyle ? (
            <>
              <View style={styles.cardHeader}>
                <SkeletonLoader width={44} height={44} borderRadius={22} />
                <View style={styles.cardTextContainer}>
                  <SkeletonLoader width="70%" height={18} />
                  <SkeletonLoader width="40%" height={14} />
                </View>
              </View>
              <SkeletonLoader width="100%" height={12} />
              <SkeletonLoader width="60%" height={12} />
            </>
          ) : (
            <>
              <View style={styles.listRow}>
                <SkeletonLoader width={44} height={44} borderRadius={22} />
                <View style={styles.listRowContent}>
                  <SkeletonLoader width="70%" height={16} />
                  <SkeletonLoader width="40%" height={14} />
                </View>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
            </>
          )}
        </View>
      ))}
    </View>
  );
};

export interface SkeletonAvatarProps {
  /** Size of the avatar (default: 48) */
  size?: number;
}

/**
 * A circular skeleton loader for avatar placeholders.
 */
export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 48 }) => {
  return <SkeletonLoader width={size} height={size} borderRadius={size / 2} />;
};

export interface SkeletonTextProps {
  /** Number of lines to show (default: 3) */
  lines?: number;
  /** Width of each line (can be array or number) */
  lineWidths?: number[] | number;
  /** Spacing between lines (default: 8) */
  spacing?: number;
}

/**
 * A text skeleton loader with multiple lines.
 * Mimics the appearance of loading text content.
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineWidths = [90, 75, 60],
  spacing = 8,
}) => {
  const getLineWidth = (index: number): number => {
    if (Array.isArray(lineWidths)) {
      return lineWidths[index] !== undefined ? lineWidths[index] : 70;
    }
    return lineWidths;
  };

  return (
    <View style={[styles.textContainer, { gap: spacing }]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={`${getLineWidth(index)}%`}
          height={16}
          borderRadius={4}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  list: {
    paddingHorizontal: 16,
  },
  listItem: {
    marginBottom: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  listRowContent: {
    flex: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTextContainer: {
    flex: 1,
    gap: 6,
  },
  textContainer: {
    justifyContent: 'center',
  },
});