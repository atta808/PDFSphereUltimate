import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';
import { AINavigationProp } from '../../navigation/types';

export const AIScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<AINavigationProp>();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>AI Workspace</Text>
      <Button title="Summary" onPress={() => navigation.navigate(Routes.AI_SUMMARY, { fileId: 'dummy' })} />
      <Button title="Chat" onPress={() => navigation.navigate(Routes.AI_CHAT, { fileId: 'dummy' })} />
      <Button title="Translate" onPress={() => navigation.navigate(Routes.AI_TRANSLATE, { fileId: 'dummy' })} />
      <Button title="Flashcards" onPress={() => navigation.navigate(Routes.AI_FLASHCARDS, { fileId: 'dummy' })} />
      <Button title="Quiz" onPress={() => navigation.navigate(Routes.AI_QUIZ, { fileId: 'dummy' })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, marginBottom: 20 },
});