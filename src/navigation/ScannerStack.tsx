import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '../constants/routes';
import { ScannerStackParamList } from './types';
import { ScannerScreen } from '../screens/ScannerScreen/ScannerScreen';

const Stack = createStackNavigator<ScannerStackParamList>();

export const ScannerStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.SCANNER} component={ScannerScreen} />
    </Stack.Navigator>
  );
};