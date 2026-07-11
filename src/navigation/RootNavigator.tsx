import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native";
import { Routes } from "../constants/routes";
import { useTheme } from "../theme/ThemeContext";
import { MainTabs } from "./MainTabs";

const Stack = createStackNavigator();

/**
 * Deep linking configuration.
 * Allows the app to respond to URLs like pdfsphere://viewer/123 or https://pdfsphere.app/viewer/123
 */
const linking = {
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
      }}
      linking={linking}
      fallback={<Text>Loading...</Text>}
    >
      <Stack.Navigator
        initialRouteName={Routes.MAIN}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
        }}
      >
        {/* Main app – bottom tabs with nested stacks */}
        <Stack.Screen name={Routes.MAIN} component={MainTabs} />

        {/* Optional: Add an Auth screen here later if needed */}
        {/* <Stack.Screen name={Routes.AUTH} component={AuthScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
