import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { DeepSeekProvider } from '../../services/ai/DeepSeekProvider';
import { AIProviderFactory, AIProviderType } from '../../services/ai/AIProviderFactory';
import { logger } from '../../utils/logger';

export const AISettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [providerType, setProviderType] = useState<AIProviderType>('deepseek');
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Load saved API key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const stored = await SecureStore.getItemAsync('deepseek_api_key');
      if (stored) {
        setApiKey(stored);
        setIsConfigured(true);
      }
    } catch (error) {
      logger.error('Failed to load API key:', error);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key.');
      return;
    }

    setIsLoading(true);
    try {
      // Save the key securely
      await SecureStore.setItemAsync('deepseek_api_key', apiKey.trim());

      // Test the key with a simple request (optional but recommended)
      setIsTestingKey(true);
      const provider = new DeepSeekProvider();
      await provider.setApiKey(apiKey.trim());

      // Test with a minimal request (e.g., a simple prompt)
      // We'll try a small summarization to verify the key works
      try {
        await provider.summarize('Test document. This is a test.', { maxTokens: 10 });
        setIsConfigured(true);
        Alert.alert('Success', 'API key saved and verified successfully!');
      } catch (testError: any) {
        // If test fails, the key might be invalid
        Alert.alert(
          'Verification Failed',
          `Your API key was saved but verification failed: ${testError.message || 'Unknown error'}. Please check your key and try again.`
        );
        // Keep the key saved but mark as not configured
        setIsConfigured(false);
      }
    } catch (error: any) {
      logger.error('Failed to save API key:', error);
      Alert.alert('Error', `Failed to save API key: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setIsTestingKey(false);
    }
  };

  const removeApiKey = async () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove the stored API key? AI features will not work without a key.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('deepseek_api_key');
              setApiKey('');
              setIsConfigured(false);
              Alert.alert('Removed', 'API key has been removed.');
            } catch (error) {
              logger.error('Failed to remove API key:', error);
              Alert.alert('Error', 'Failed to remove API key.');
            }
          },
        },
      ]
    );
  };

  const handleProviderChange = (type: AIProviderType) => {
    setProviderType(type);
    // In the future, this could switch the provider selection UI
    // For now, we only support DeepSeek, but we'll show the UI
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Provider Selection (future proof) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>AI Provider</Text>
        <View style={styles.providerContainer}>
          <TouchableOpacity
            style={[
              styles.providerOption,
              {
                backgroundColor: providerType === 'deepseek' ? theme.colors.primarySurface : theme.colors.surface,
                borderColor: providerType === 'deepseek' ? theme.colors.primary : theme.colors.border,
                borderWidth: providerType === 'deepseek' ? 2 : 1,
              },
            ]}
            onPress={() => handleProviderChange('deepseek')}
          >
            <Text style={[styles.providerName, { color: theme.colors.text }]}>DeepSeek</Text>
            <Text style={[styles.providerStatus, { color: theme.colors.textSecondary }]}>
              {isConfigured ? '✅ Connected' : '⚠️ No key'}
            </Text>
          </TouchableOpacity>
          {/* Add other providers later */}
          <TouchableOpacity
            style={[
              styles.providerOption,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                opacity: 0.5,
              },
            ]}
            disabled
          >
            <Text style={[styles.providerName, { color: theme.colors.textSecondary }]}>Gemini</Text>
            <Text style={[styles.providerStatus, { color: theme.colors.textSecondary }]}>Coming soon</Text>
          </TouchableOpacity>
        </View>

        {/* API Key Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            DeepSeek API Key
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Enter your DeepSeek API key to enable AI features. Your key is stored securely on your device.
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="sk-..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary },
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={saveApiKey}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.saveButtonText}> {isTestingKey ? 'Verifying...' : 'Saving...'}</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {isConfigured ? 'Update API Key' : 'Save & Verify'}
              </Text>
            )}
          </TouchableOpacity>

          {isConfigured && (
            <TouchableOpacity
              style={[styles.removeButton, { borderColor: theme.colors.error }]}
              onPress={removeApiKey}
            >
              <Text style={[styles.removeButtonText, { color: theme.colors.error }]}>
                Remove API Key
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.primarySurface }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Your API key is stored locally using secure storage and is never transmitted to any third party without your explicit consent. The key is only sent to the AI provider when you use AI features.
          </Text>
        </View>

        {/* Usage Notes */}
        <View style={[styles.infoBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}>
          <Ionicons name="bulb-outline" size={20} color={theme.colors.warning} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            To get a DeepSeek API key, visit{' '}
            <Text style={{ color: theme.colors.primary }} onPress={() => {}}>
              platform.deepseek.com
            </Text>
            . You'll need to sign up and create an API key from your dashboard.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  providerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  providerOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  providerStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  removeButtonText: {
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});