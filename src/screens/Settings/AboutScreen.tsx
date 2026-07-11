import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export const AboutScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const version = Constants.expoConfig?.version || '1.0.0';
  const appName = Constants.expoConfig?.name || 'PDFSphere';

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* App Logo / Icon placeholder */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
        </View>

        {/* App Info Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.appName, { color: theme.colors.text }]}>{appName}</Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Version {version}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            A professional, offline-first PDF productivity application with AI-powered features.
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>17</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Features</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>100%</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Offline</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>v1.0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Release</Text>
          </View>
        </View>

        {/* Links */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resources</Text>

        <TouchableOpacity
          style={[styles.link, { borderColor: theme.colors.border }]}
          onPress={() => handleOpenLink('https://github.com/your-repo/pdfsphere')}
        >
          <Ionicons name="logo-github" size={24} color={theme.colors.text} />
          <Text style={[styles.linkText, { color: theme.colors.text }]}>GitHub Repository</Text>
          <Ionicons name="open-outline" size={18} color={theme.colors.iconSecondary} style={styles.linkIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.link, { borderColor: theme.colors.border }]}
          onPress={() => handleOpenLink('mailto:support@pdfsphere.com')}
        >
          <Ionicons name="mail-outline" size={24} color={theme.colors.text} />
          <Text style={[styles.linkText, { color: theme.colors.text }]}>Contact Support</Text>
          <Ionicons name="open-outline" size={18} color={theme.colors.iconSecondary} style={styles.linkIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.link, { borderColor: theme.colors.border }]}
          onPress={() => handleOpenLink('https://pdfsphere.app/docs')}
        >
          <Ionicons name="document-text-outline" size={24} color={theme.colors.text} />
          <Text style={[styles.linkText, { color: theme.colors.text }]}>Documentation</Text>
          <Ionicons name="open-outline" size={18} color={theme.colors.iconSecondary} style={styles.linkIcon} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.link, { borderColor: theme.colors.border }]}
          onPress={() => handleOpenLink('https://pdfsphere.app/privacy')}
        >
          <Ionicons name="shield-outline" size={24} color={theme.colors.text} />
          <Text style={[styles.linkText, { color: theme.colors.text }]}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={18} color={theme.colors.iconSecondary} style={styles.linkIcon} />
        </TouchableOpacity>

        {/* Tech Stack */}
        <View style={[styles.techCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.techTitle, { color: theme.colors.text }]}>Built With</Text>
          <View style={styles.techTags}>
            {['React Native', 'Expo', 'TypeScript', 'SQLite', 'PDF.js', 'DeepSeek AI'].map((tech) => (
              <View key={tech} style={[styles.techTag, { backgroundColor: theme.colors.primarySurface }]}>
                <Text style={[styles.techTagText, { color: theme.colors.primary }]}>{tech}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            © 2026 PDFSphere. All rights reserved.
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.colors.textSecondary }]}>
            Made with ❤️
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
  backButton: {
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  linkIcon: {
    marginLeft: 'auto',
  },
  techCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  techTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  techTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});