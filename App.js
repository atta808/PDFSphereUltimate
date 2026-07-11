import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { ErrorBoundary } from "./src/components/common/ErrorBoundary";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { setupGlobalErrorHandlers } from "./src/utils/errorHandler";
import { logger } from "./src/utils/logger";

// Setup global error handlers
setupGlobalErrorHandlers();

/**
 * PDFSphere – Main Application Entry Point
 *
 * The app is wrapped with:
 * 1. SafeAreaProvider – for safe area insets
 * 2. ThemeProvider – for light/dark theme support
 * 3. ErrorBoundary – to catch and handle rendering errors
 * 4. RootNavigator – the main navigation container
 */
export default function App() {
  logger.info("PDFSphere app starting...");

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
}
