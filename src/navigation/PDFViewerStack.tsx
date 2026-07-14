import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Routes } from "../constants/routes";
import { PDFViewerStackParamList } from "./types";

// Import all screens in this stack
import { PDFViewerScreen } from "../screens/PDFViewerScreen/PDFViewerScreen";
import { EditorScreen } from "../screens/EditorScreen/EditorScreen";
import { OCRScreen } from "../screens/OCRScreen/OCRScreen";
import { TextExtractionScreen } from "../screens/TextExtractionScreen/TextExtractionScreen";
import { SearchScreen } from "../screens/SearchScreen/SearchScreen";

const Stack = createStackNavigator<PDFViewerStackParamList>();

export const PDFViewerStack: React.FC = () => {
  return (
    <Stack.Navigator id="PDFViewerStack"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name={Routes.PDF_VIEWER} component={PDFViewerScreen} />
      <Stack.Screen name={Routes.EDITOR} component={EditorScreen as any} />
      <Stack.Screen name={Routes.OCR} component={OCRScreen} />
      <Stack.Screen
        name={Routes.TEXT_EXTRACTION}
        component={TextExtractionScreen}
      />
      <Stack.Screen name={Routes.SEARCH} component={SearchScreen} />
    </Stack.Navigator>
  );
};
