/**
 * Storage keys for AsyncStorage, SecureStore, and SQLite.
 */
export const StorageKeys = {
  // AsyncStorage (non-sensitive)
  THEME: '@pdfsphere/theme',
  LANGUAGE: '@pdfsphere/language',
  ONBOARDING_COMPLETED: '@pdfsphere/onboarding_completed',
  LAST_OPENED_FILE: '@pdfsphere/last_opened_file',
  RECENT_FILES: '@pdfsphere/recent_files',
  USER_PREFERENCES: '@pdfsphere/user_preferences',
  AI_CONSENT: '@pdfsphere/ai_consent',

  // SecureStore (sensitive)
  API_KEYS: '@pdfsphere/api_keys',
  AUTH_TOKEN: '@pdfsphere/auth_token',
  ENCRYPTION_KEY: '@pdfsphere/encryption_key',

  // SQLite table names
  SQLITE_TABLES: {
    FILES: 'files',
    FOLDERS: 'folders',
    TAGS: 'tags',
    BOOKMARKS: 'bookmarks',
    COLLECTIONS: 'collections',
    SETTINGS: 'settings',
    EXTRACTED_TEXT: 'extracted_text',
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    CHUNKS: 'chunks',
    INDEXING_JOBS: 'indexing_jobs',
    PIPELINE_RESULTS: 'pipeline_results',
  },
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];