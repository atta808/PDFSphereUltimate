import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Routes } from "../constants/routes";
import { AIStackParamList } from "./types";

// Import all AI screens
import { AIScreen } from "../screens/AIScreen/AIScreen";
import { SummaryScreen } from "../screens/AI/SummaryScreen";
import { ChatScreen } from "../screens/AI/ChatScreen";
import { TranslationScreen } from "../screens/AI/TranslationScreen";
import { FlashcardsScreen } from "../screens/AI/FlashcardsScreen";
import { QuizScreen } from "../screens/AI/QuizScreen";

const Stack = createStackNavigator<AIStackParamList>();

export const AIStack: React.FC = () => {
  return (
    <Stack.Navigator id="AIStack"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "transparent" },

      }}
    >
      <Stack.Screen name={Routes.AI} component={AIScreen} />
      <Stack.Screen name={Routes.AI_SUMMARY} component={SummaryScreen} />
      <Stack.Screen name={Routes.AI_CHAT} component={ChatScreen} />
      <Stack.Screen name={Routes.AI_TRANSLATE} component={TranslationScreen} />
      <Stack.Screen name={Routes.AI_FLASHCARDS} component={FlashcardsScreen} />
      <Stack.Screen name={Routes.AI_QUIZ} component={QuizScreen} />
    </Stack.Navigator>
  );
};
