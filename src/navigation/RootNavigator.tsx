import React from "react";
import { NavigationContainer, Theme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native";
import { Routes } from "../constants/routes";
import { useTheme } from "../theme/ThemeContext";
import { MainTabs } from "./MainTabs";
import { PDFViewerStack } from "./PDFViewerStack";

const Stack = createStackNavigator<any>();

/**
 * Deep linking configuration.
 * Allows the app to respond to URLs like pdfsphere://viewer/123 or https://pdfsphere.app/viewer/123
 */
const linking: any = {
  prefixes: ["pdfsphere://", "https://pdfsphere.app", "http://pdfsphere.app"],
  config: {
    screens: {
      [Routes.MAIN]: {
        screens: {
          [Routes.HOME]: "home",
          [Routes.FILES]: "files",
          [Routes.PDF_VIEWER]: "viewer/:fileId",
          [Routes.SCANNER]: "scan",
        },
      },
    },
  },
};

/**
 * Root navigator – wraps the app with NavigationContainer and the main stack.
 */
export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <NavigationContainer
      theme={{
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
        dark: theme.isDark,
        fonts: { regular: { fontFamily: '', fontWeight: 'normal' }, medium: { fontFamily: '', fontWeight: '500' }, bold: { fontFamily: '', fontWeight: 'bold' }, heavy: { fontFamily: '', fontWeight: '900' } }
      } as Theme}
      linking={linking}
      fallback={<Text>Loading...</Text>}
    >
      <Stack.Navigator id="RootNavigator"
        initialRouteName={Routes.MAIN}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
        }}
      >
        {/* Main app – bottom tabs with nested stacks */}
        <Stack.Screen name={Routes.MAIN} component={MainTabs} />
        <Stack.Screen name={Routes.PDF_VIEWER} component={PDFViewerStack} />

        {/* Optional: Add an Auth screen here later if needed */}
        {/* <Stack.Screen name={Routes.AUTH} component={AuthScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
