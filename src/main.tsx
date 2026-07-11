import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './theme/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RootNavigator } from './navigation/RootNavigator';
import { setupGlobalErrorHandlers } from './utils/errorHandler';
import { logger } from './utils/logger';

// Setup global error handlers
setupGlobalErrorHandlers();

export const MainApp: React.FC = () => {
  logger.info('PDFSphere main app starting...');

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <StatusBar style="auto" />
          <RootNavigator />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

// Default export for Expo
export default MainApp;