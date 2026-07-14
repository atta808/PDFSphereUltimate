import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Routes } from '../constants/routes';
import { useTheme } from '../theme/ThemeContext';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { FileManagerScreen } from '../screens/FileManagerScreen/FileManagerScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { AIScreen } from '../screens/AIScreen/AIScreen';
import { SettingsScreen } from '../screens/SettingsScreen/SettingsScreen';
import { PDFViewerStack } from './PDFViewerStack';
import { ScannerStack } from './ScannerStack';
import { EditorStack } from './EditorStack';
import { AIStack } from './AIStack';
import { SettingsStack } from './SettingsStack';
import { MainTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator id="MainTabs"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === Routes.HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === Routes.FILES) {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === Routes.SCANNER) {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === Routes.AI) {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === Routes.SETTINGS) {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.iconSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name={Routes.HOME} component={HomeScreen} />
      <Tab.Screen name={Routes.FILES} component={FileManagerScreen} />
      <Tab.Screen name={Routes.SCANNER} component={ScannerStack} />
      <Tab.Screen name={Routes.AI} component={AIStack} />
      <Tab.Screen name={Routes.SETTINGS} component={SettingsStack} />
    </Tab.Navigator>
  );
};