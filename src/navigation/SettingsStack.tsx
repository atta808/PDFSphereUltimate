import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '../constants/routes';
import { SettingsStackParamList } from './types';
import { SettingsScreen } from '../screens/SettingsScreen/SettingsScreen';
import { AppearanceScreen } from '../screens/Settings/AppearanceScreen';
import { LanguageScreen } from '../screens/Settings/LanguageScreen';
import { StorageScreen } from '../screens/Settings/StorageScreen';
import { AISettingsScreen } from '../screens/Settings/AISettingsScreen';
import { OCRSettingsScreen } from '../screens/Settings/OCRSettingsScreen';
import { AboutScreen } from '../screens/Settings/AboutScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

export const SettingsStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.SETTINGS} component={SettingsScreen} />
      <Stack.Screen name={Routes.SETTINGS_APPEARANCE} component={AppearanceScreen} />
      <Stack.Screen name={Routes.SETTINGS_LANGUAGE} component={LanguageScreen} />
      <Stack.Screen name={Routes.SETTINGS_STORAGE} component={StorageScreen} />
      <Stack.Screen name={Routes.SETTINGS_AI} component={AISettingsScreen} />
      <Stack.Screen name={Routes.SETTINGS_OCR} component={OCRSettingsScreen} />
      <Stack.Screen name={Routes.SETTINGS_ABOUT} component={AboutScreen} />
    </Stack.Navigator>
  );
};