import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '../constants/routes';
import { ScannerStackParamList } from './types';
import { ScannerScreen } from '../screens/ScannerScreen';

const Stack = createStackNavigator<ScannerStackParamList>();

export const ScannerStack: React.FC = () => {
  return (
    <Stack.Navigator id="ScannerStack"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name={Routes.SCANNER_CAMERA} component={ScannerScreen as any} />
    </Stack.Navigator>
  );
};
