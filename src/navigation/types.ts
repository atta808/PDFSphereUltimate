import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Routes } from "../constants/routes";

// ==================== Root Stack ====================

export type RootStackParamList = {
  [Routes.ROOT]: undefined;
  [Routes.AUTH]: undefined;
  [Routes.MAIN]: undefined;
};

// ==================== Main Tabs ====================

export type MainTabParamList = {
  [Routes.HOME]: undefined;
  [Routes.FILES]: undefined;
  [Routes.SCANNER]: undefined;
  [Routes.AI]: undefined;
  [Routes.SETTINGS]: undefined;
};

// ==================== PDF Viewer Stack ====================

export type PDFViewerStackParamList = {
  [Routes.PDF_VIEWER]: { fileId: string; filePath?: string };
  [Routes.EDITOR]: { fileId: string };
  [Routes.OCR]: { fileId: string };
  [Routes.TEXT_EXTRACTION]: undefined;
  [Routes.SEARCH]: undefined;
};

// ==================== Scanner Stack ====================

export type ScannerStackParamList = {
  [Routes.SCANNER]: undefined;
  // Future: camera, gallery, etc.
};

// ==================== Editor Stack ====================

export type EditorStackParamList = {
  [Routes.EDITOR]: { fileId: string };
  // Future: merge, split, rotate, etc.
};

// ==================== AI Stack ====================

export type AIStackParamList = {
  [Routes.AI]: undefined;
  [Routes.AI_SUMMARY]: { fileId: string };
  [Routes.AI_CHAT]: { fileId: string };
  [Routes.AI_TRANSLATE]: { fileId: string };
  [Routes.AI_FLASHCARDS]: { fileId: string };
  [Routes.AI_QUIZ]: { fileId: string };
};

// ==================== Settings Stack ====================

export type SettingsStackParamList = {
  [Routes.SETTINGS]: undefined;
  [Routes.SETTINGS_APPEARANCE]: undefined;
  [Routes.SETTINGS_LANGUAGE]: undefined;
  [Routes.SETTINGS_STORAGE]: undefined;
  [Routes.SETTINGS_AI]: undefined;
  [Routes.SETTINGS_OCR]: undefined;
  [Routes.SETTINGS_ABOUT]: undefined;
};

// ==================== Combined Navigation Prop Types ====================

// Root stack
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

// Main tabs
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// PDF Viewer stack
export type PDFViewerNavigationProp =
  StackNavigationProp<PDFViewerStackParamList>;
export type PDFViewerScreenRouteProp = RouteProp<
  PDFViewerStackParamList,
  typeof Routes.PDF_VIEWER
>;

// Scanner stack
export type ScannerNavigationProp = StackNavigationProp<ScannerStackParamList>;

// Editor stack
export type EditorNavigationProp = StackNavigationProp<EditorStackParamList>;

// AI stack
export type AINavigationProp = StackNavigationProp<AIStackParamList>;
export type AISummaryRouteProp = RouteProp<
  AIStackParamList,
  typeof Routes.AI_SUMMARY
>;
export type AIChatRouteProp = RouteProp<
  AIStackParamList,
  typeof Routes.AI_CHAT
>;
export type AITranslateRouteProp = RouteProp<
  AIStackParamList,
  typeof Routes.AI_TRANSLATE
>;
export type AIFlashcardsRouteProp = RouteProp<
  AIStackParamList,
  typeof Routes.AI_FLASHCARDS
>;
export type AIQuizRouteProp = RouteProp<
  AIStackParamList,
  typeof Routes.AI_QUIZ
>;

// Settings stack
export type SettingsNavigationProp =
  StackNavigationProp<SettingsStackParamList>;

// ==================== Helper: Screen Props ====================

/**
 * Use this type for screens that need both stack and tab navigation.
 * Example: A screen nested inside a stack that is itself inside a tab.
 */
export type CompositeScreenProps<
  T extends StackNavigationProp<any, any> | BottomTabNavigationProp<any, any>,
  U extends StackNavigationProp<any, any> | BottomTabNavigationProp<any, any>,
> = T & { navigation: T } & { route: RouteProp<any, any> };
