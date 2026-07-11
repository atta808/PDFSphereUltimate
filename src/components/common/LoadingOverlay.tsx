import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Optional message to display below the spinner */
  message?: string;
  /** Whether the overlay should be transparent (default: true) */
  transparent?: boolean;
  /** Whether the overlay should be dismissible (default: false) */
  dismissible?: boolean;
  /** Callback when overlay is dismissed (only if dismissible) */
  onDismiss?: () => void;
}

/**
 * Full-screen loading overlay with an activity indicator and optional message.
 * Used for blocking operations like AI generation, PDF processing, etc.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
  dismissible = false,
  onDismiss,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissible ? onDismiss : undefined}
    >
      <View style={[styles.overlay, { backgroundColor: transparent ? 'rgba(0,0,0,0.5)' : theme.colors.background }]}>
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {message && <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>}
          {dismissible && (
            <Text style={[styles.dismissText, { color: theme.colors.textSecondary }]}>
              Tap outside to dismiss
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    paddingVertical: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minWidth: 200,
    maxWidth: '80%',
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  dismissText: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
  },
});