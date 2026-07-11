import { Alert } from 'react-native';
import { logger } from './logger';

// ==================== Error Types ====================

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError extends Error {
  code?: string;
  severity?: ErrorSeverity;
  userMessage?: string;
  originalError?: Error;
  context?: Record<string, any>;
}

/**
 * Create a new AppError with the given parameters.
 */
export function createAppError(
  message: string,
  options?: {
    code?: string;
    severity?: ErrorSeverity;
    userMessage?: string;
    originalError?: Error;
    context?: Record<string, any>;
  }
): AppError {
  const error = new Error(message) as AppError;
  error.name = 'AppError';
  if (options?.code) error.code = options.code;
  if (options?.severity) error.severity = options.severity;
  if (options?.userMessage) error.userMessage = options.userMessage;
  if (options?.originalError) error.originalError = options.originalError;
  if (options?.context) error.context = options.context;
  return error;
}

// ==================== Error Handler ====================

/**
 * Central error handler.
 * Logs the error, shows a user-friendly alert, and optionally reports to a monitoring service.
 * @param error - The error to handle (Error or AppError).
 * @param fallbackMessage - Optional fallback user message if error.userMessage is not set.
 * @param context - Optional additional context to log.
 */
export function handleError(
  error: Error | AppError,
  fallbackMessage?: string,
  context?: Record<string, any>
): void {
  const appError = error as AppError;
  const severity = appError.severity || 'error';
  const userMessage = appError.userMessage || fallbackMessage || 'An unexpected error occurred.';
  const code = appError.code || 'UNKNOWN';

  // Log the error
  logger.error(`[${code}] ${error.message}`, {
    severity,
    stack: error.stack,
    context: { ...appError.context, ...context },
    originalError: appError.originalError,
  });

  // Show alert based on severity
  if (severity === 'critical') {
    Alert.alert(
      'Critical Error',
      `${userMessage}\n\nError code: ${code}`,
      [
        { text: 'Restart App', onPress: () => {} },
        { text: 'Continue', style: 'cancel' },
      ],
      { cancelable: false }
    );
  } else if (severity === 'error' || severity === 'warning') {
    Alert.alert('Error', userMessage, [{ text: 'OK' }]);
  } else {
    // Info severity: just log, no alert
    // Optionally show a toast or snackbar here
  }

  // In production, send to error monitoring service (e.g., Sentry, BugSnag)
  // if (__DEV__) { ... } else { reportToMonitoringService(error) }
}

/**
 * Wrap a synchronous function with error handling.
 * @param fn - The function to wrap.
 * @param fallbackMessage - Fallback user message on error.
 * @param context - Additional context to log.
 * @returns The result of the function, or undefined if an error occurred.
 */
export function wrapWithErrorHandler<T>(
  fn: () => T,
  fallbackMessage?: string,
  context?: Record<string, any>
): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error as Error, fallbackMessage, context);
    return undefined;
  }
}

/**
 * Wrap an async function with error handling.
 * @param fn - The async function to wrap.
 * @param fallbackMessage - Fallback user message on error.
 * @param context - Additional context to log.
 * @returns A promise resolving to the result, or undefined if an error occurred.
 */
export async function wrapAsyncWithErrorHandler<T>(
  fn: () => Promise<T>,
  fallbackMessage?: string,
  context?: Record<string, any>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error as Error, fallbackMessage, context);
    return undefined;
  }
}

/**
 * Wrapper for React Native async operations (e.g., network calls, DB operations).
 * Provides a simple way to handle errors without repetitive try-catch blocks.
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options?: {
    fallbackMessage?: string;
    context?: Record<string, any>;
    onError?: (error: Error) => void;
    onSuccess?: (result: T) => void;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    if (options?.onSuccess) options.onSuccess(result);
    return result;
  } catch (error) {
    const err = error as Error;
    handleError(err, options?.fallbackMessage, options?.context);
    if (options?.onError) options.onError(err);
    return null;
  }
}

// ==================== Specific Error Factories ====================

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  OCR_ERROR: 'OCR_ERROR',
  AI_ERROR: 'AI_ERROR',
  PDF_ERROR: 'PDF_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Create a network error.
 */
export function networkError(message: string, originalError?: Error): AppError {
  return createAppError(message, {
    code: ErrorCodes.NETWORK_ERROR,
    severity: 'error',
    userMessage: 'Network error. Please check your connection and try again.',
    originalError,
  });
}

/**
 * Create an API error.
 */
export function apiError(message: string, originalError?: Error): AppError {
  return createAppError(message, {
    code: ErrorCodes.API_ERROR,
    severity: 'error',
    userMessage: 'Service temporarily unavailable. Please try again later.',
    originalError,
  });
}

/**
 * Create an AI error.
 */
export function aiError(message: string, originalError?: Error): AppError {
  return createAppError(message, {
    code: ErrorCodes.AI_ERROR,
    severity: 'error',
    userMessage: 'AI service error. Please check your API key or try again later.',
    originalError,
  });
}

/**
 * Create a file error.
 */
export function fileError(message: string, originalError?: Error): AppError {
  return createAppError(message, {
    code: ErrorCodes.FILE_ERROR,
    severity: 'error',
    userMessage: 'File operation failed. Please check the file and try again.',
    originalError,
  });
}

/**
 * Create a database error.
 */
export function databaseError(message: string, originalError?: Error): AppError {
  return createAppError(message, {
    code: ErrorCodes.DATABASE_ERROR,
    severity: 'critical',
    userMessage: 'Database error. Please restart the app or contact support.',
    originalError,
  });
}

// ==================== React Native Error Handler ====================

/**
 * Set up global error handlers for React Native.
 * Call this during app initialization.
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught JS errors
  const originalErrorHandler = ErrorUtils.getGlobalHandler?.() || ((error: Error, isFatal: boolean) => {
    logger.fatal('Uncaught JS error:', error, { isFatal });
  });

  ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    // Log the error
    logger.fatal('Unhandled JS error:', error, { isFatal });

    // Show alert for fatal errors
    if (isFatal) {
      Alert.alert(
        'Fatal Error',
        'The app encountered a critical error and needs to restart.',
        [{ text: 'Restart', onPress: () => {} }],
        { cancelable: false }
      );
    } else {
      handleError(error, 'An unexpected error occurred.');
    }

    // Call the original handler
    originalErrorHandler(error, isFatal);
  });

  // Handle unhandled promise rejections
  const originalUnhandledRejection = global?.onerror?.['unhandledrejection'] || (() => {});
  // @ts-ignore - React Native specific
  global?.onerror?.['unhandledrejection'] = (error: Error) => {
    handleError(error, 'Unhandled promise rejection.');
    originalUnhandledRejection(error);
  };

  logger.info('Global error handlers installed.');
}