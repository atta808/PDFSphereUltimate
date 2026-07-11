import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '../constants/routes';
import { EditorStackParamList } from './types';
import { EditorScreen } from '../screens/EditorScreen/EditorScreen';

const Stack = createStackNavigator<EditorStackParamList>();

export const EditorStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Routes.EDITOR} component={EditorScreen} />
    </Stack.Navigator>
  );
};