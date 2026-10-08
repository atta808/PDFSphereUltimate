/**
 * Navigation route names.
 * Centralized route definitions to avoid typos and ensure consistency.
 */
export const Routes = {
  // Root & Auth
  ROOT: "Root",
  AUTH: "Auth",
  MAIN: "Main",

  // Main Tabs
  HOME: "Home",
  FILES: "Files",
  SCANNER: "Scanner",
  SCANNER_CAMERA: "ScannerCamera",
  AI: "AI",
  SETTINGS: "Settings",

  // PDF Viewer Stack
  PDF_VIEWER_STACK: "PDFViewerStack",
  PDF_VIEWER: "PDFViewer",
  EDITOR: "Editor",
  OCR: "OCR",
  SEARCH: "Search",
  TEXT_EXTRACTION: "TextExtraction",

  // AI Stack
  AI_SUMMARY: "AISummary",
  AI_CHAT: "AIChat",
  AI_TRANSLATE: "AITranslate",
  AI_FLASHCARDS: "AIFlashcards",
  AI_QUIZ: "AIQuiz",

  // Settings Stack
  SETTINGS_APPEARANCE: "SettingsAppearance",
  SETTINGS_LANGUAGE: "SettingsLanguage",
  SETTINGS_STORAGE: "SettingsStorage",
  SETTINGS_AI: "SettingsAI",
  SETTINGS_OCR: "SettingsOCR",
  SETTINGS_ABOUT: "SettingsAbout",
} as const;

/**
 * Type representing any valid route name.
 */
export type RouteName = (typeof Routes)[keyof typeof Routes];
