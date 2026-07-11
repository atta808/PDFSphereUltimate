import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '../../constants/routes';
import { SettingsNavigationProp } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';

type SettingItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: keyof typeof Routes;
  onPress?: () => void;
  badge?: string;
  showChevron?: boolean;
};

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SettingsNavigationProp>();
  const [isAIConfigured, setIsAIConfigured] = useState(false);

  // Check if AI API key is configured
  useEffect(() => {
    const checkAIKey = async () => {
      try {
        const key = await SecureStore.getItemAsync('deepseek_api_key');
        setIsAIConfigured(!!key);
      } catch (error) {
        // ignore
      }
    };
    checkAIKey();
  }, []);

  const settingsItems: SettingItem[] = [
    {
      id: 'appearance',
      title: 'Appearance',
      icon: 'color-palette-outline',
      route: Routes.SETTINGS_APPEARANCE,
    },
    {
      id: 'language',
      title: 'Language',
      icon: 'language-outline',
      route: Routes.SETTINGS_LANGUAGE,
    },
    {
      id: 'ai',
      title: 'AI Settings',
      icon: 'sparkles-outline',
      route: Routes.SETTINGS_AI,
      badge: isAIConfigured ? 'Connected' : 'Setup Required',
    },
    {
      id: 'storage',
      title: 'Storage',
      icon: 'folder-outline',
      route: Routes.SETTINGS_STORAGE,
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      route: Routes.SETTINGS_ABOUT,
    },
  ];

  const handlePress = (item: SettingItem) => {
    if (item.route) {
      navigation.navigate(item.route as any);
    } else if (item.onPress) {
      item.onPress();
    }
  };

  const getBadgeStyle = (badge: string | undefined) => {
    if (!badge) return {};
    if (badge === 'Connected') {
      return { backgroundColor: theme.colors.success, color: 'white' };
    }
    if (badge === 'Setup Required') {
      return { backgroundColor: theme.colors.warning, color: 'white' };
    }
    return { backgroundColor: theme.colors.primary, color: 'white' };
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primarySurface }]}>
              <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
            </View>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{item.title}</Text>
            {item.badge && (
              <View style={[styles.badge, getBadgeStyle(item.badge)]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={theme.colors.iconSecondary} />
          </TouchableOpacity>
        ))}

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            PDFSphere v1.0.0
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});