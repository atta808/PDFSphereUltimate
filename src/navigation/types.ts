import { RouteProp, NavigatorScreenParams, CompositeNavigationProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Routes } from "../constants/routes";

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
};

// ==================== Editor Stack ====================

export type EditorStackParamList = {
  [Routes.EDITOR]: { fileId: string };
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

// ==================== Main Tabs ====================

export type MainTabParamList = {
  [Routes.HOME]: undefined;
  [Routes.FILES]: undefined;
  [Routes.SCANNER]: NavigatorScreenParams<ScannerStackParamList>;
  [Routes.AI]: NavigatorScreenParams<AIStackParamList>;
  [Routes.SETTINGS]: NavigatorScreenParams<SettingsStackParamList>;
};

// ==================== Root Stack ====================

export type RootStackParamList = {
  [Routes.ROOT]: undefined;
  [Routes.AUTH]: undefined;
  [Routes.MAIN]: NavigatorScreenParams<MainTabParamList>;
  [Routes.PDF_VIEWER_STACK]: NavigatorScreenParams<PDFViewerStackParamList>;
};

// ==================== Combined Navigation Prop Types ====================

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<RootStackParamList>
>;

export type PDFViewerNavigationProp = CompositeNavigationProp<
  StackNavigationProp<PDFViewerStackParamList>,
  StackNavigationProp<RootStackParamList>
>;

export type PDFViewerScreenRouteProp = RouteProp<
  PDFViewerStackParamList,
  typeof Routes.PDF_VIEWER
>;

export type ScannerNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ScannerStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type EditorNavigationProp = CompositeNavigationProp<
  StackNavigationProp<EditorStackParamList>,
  CompositeNavigationProp<
    StackNavigationProp<PDFViewerStackParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type AINavigationProp = CompositeNavigationProp<
  StackNavigationProp<AIStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

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

export type SettingsNavigationProp = CompositeNavigationProp<
  StackNavigationProp<SettingsStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    StackNavigationProp<RootStackParamList>
  >
>;

// ==================== Helper: Screen Props ====================

export type CompositeScreenProps<
  T extends StackNavigationProp<any, any> | BottomTabNavigationProp<any, any>,
  U extends StackNavigationProp<any, any> | BottomTabNavigationProp<any, any>,
> = T & { navigation: T } & { route: RouteProp<any, any> };
