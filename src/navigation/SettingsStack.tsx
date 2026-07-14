import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '../constants/routes';
import { SettingsStackParamList } from './types';

// Import screens
import { SettingsScreen } from '../screens/SettingsScreen/SettingsScreen';
import { AppearanceScreen } from '../screens/Settings/AppearanceScreen';
import { LanguageScreen } from '../screens/Settings/LanguageScreen';
import { StorageScreen } from '../screens/Settings/StorageScreen';
import { AISettingsScreen } from '../screens/Settings/AISettingsScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsStack: React.FC = () => {
  return (
    <Stack.Navigator id="SettingsStack"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name={Routes.SETTINGS} component={SettingsScreen as any} />
      <Stack.Screen name={Routes.SETTINGS_APPEARANCE} component={AppearanceScreen as any} />
      <Stack.Screen name={Routes.SETTINGS_LANGUAGE} component={LanguageScreen as any} />
      <Stack.Screen name={Routes.SETTINGS_STORAGE} component={StorageScreen as any} />
      <Stack.Screen name={Routes.SETTINGS_AI} component={AISettingsScreen as any} />
      {/* OCR Settings component needs to be created or removed from navigation. Creating a placeholder later or removing it for now. */}
    </Stack.Navigator>
  );
};
