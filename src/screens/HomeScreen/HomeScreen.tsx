import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Routes } from "../../constants/routes";
import { MainTabNavigationProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { fileRepository } from "../../repository/FileRepository";
import { FileModel } from "../../models/FileModel";
import { MainTabParamList } from "../../navigation/types";

type QuickAction = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: keyof typeof Routes;
  onPress?: () => void;
};

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentFiles, setRecentFiles] = useState<FileModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load recent files
  const loadRecentFiles = useCallback(async () => {
    try {
      const files = await fileRepository.getRecentFiles(5);
      setRecentFiles(files);
    } catch (error) {
      console.error("Failed to load recent files:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and refresh
  React.useEffect(() => {
    loadRecentFiles();
  }, [loadRecentFiles]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentFiles();
  };

  // Quick action items
  const quickActions: QuickAction[] = [
    {
      id: "open",
      title: "Open PDF",
      icon: "folder-open",
      route: Routes.FILES as any,
    },
    {
      id: "scan",
      title: "Scan",
      icon: "camera",
      route: Routes.SCANNER as any,
    },
    {
      id: "create",
      title: "Create PDF",
      icon: "create",
      onPress: () => {
        // Navigate to PDF creation (not yet implemented)
        console.log("Create PDF tapped");
        Alert.alert(
          "Coming Soon",
          "PDF creation feature is under development.",
        );
      },
    },
    {
      id: "ai",
      title: "AI Summary",
      icon: "sparkles",
      route: Routes.AI,
    },
    {
      id: "extract",
      title: "Extract Text",
      icon: "text-outline",
      onPress: () => {
        // Navigate to Text Extraction screen
        navigation.navigate(Routes.PDF_VIEWER, { screen: Routes.TEXT_EXTRACTION });
      },
    },
    {
      id: "chat",
      title: "Chat with PDF",
      icon: "chatbubbles-outline",
      onPress: () => {
        // Navigate to AI Chat – we need a file ID. We'll navigate to AI tab.
        navigation.navigate(Routes.AI, { screen: Routes.AI });
        // In the AI tab, user can select a file.
      },
    },
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (action.route) {
      navigation.navigate(action.route as Extract<keyof MainTabParamList, string>);
    } else if (action.onPress) {
      action.onPress();
    }
  };

  const renderRecentFile = ({ item }: { item: FileModel }) => (
    <TouchableOpacity
      style={[styles.fileItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        navigation.navigate(Routes.PDF_VIEWER, { screen: Routes.PDF_VIEWER, params: { fileId: item.id, filePath: item.uri } });
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.fileIcon,
          { backgroundColor: theme.colors.primarySurface },
        ]}
      >
        <Ionicons name="document-text" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.fileInfo}>
        <Text
          style={[styles.fileName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.fileMeta, { color: theme.colors.textSecondary }]}>
          {item.pages} pages ·{" "}
          {new Date(item.lastModified).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.iconSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[styles.greeting, { color: theme.colors.textSecondary }]}
            >
              Good Morning 👋
            </Text>
            <Text style={[styles.welcome, { color: theme.colors.text }]}>
              Welcome back!
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate(Routes.SETTINGS, { screen: Routes.SETTINGS })}
          >
            <Ionicons
              name="person-circle"
              size={40}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => navigation.navigate(Routes.PDF_VIEWER, { screen: Routes.SEARCH })}
          activeOpacity={0.7}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.iconSecondary}
            style={styles.searchIcon}
          />
          <Text
            style={[
              styles.searchPlaceholder,
              { color: theme.colors.textPlaceholder },
            ]}
          >
            Search files...
          </Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionCard,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: theme.colors.primarySurface },
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[styles.quickActionTitle, { color: theme.colors.text }]}
              >
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Files Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Files
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.FILES)}>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : recentFiles.length > 0 ? (
          <FlatList
            data={recentFiles}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentFile}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyRecentContainer}>
            <Text
              style={[
                styles.emptyRecentText,
                { color: theme.colors.textSecondary },
              ]}
            >
              No recent files. Scan or import a PDF to get started.
            </Text>
          </View>
        )}

        {/* Spacer for bottom padding */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 2,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
  },
  profileButton: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 28,
  },
  quickActionCard: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 70,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  fileMeta: {
    fontSize: 13,
    fontWeight: "400",
  },
  separator: {
    height: 10,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyRecentContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyRecentText: {
    fontSize: 14,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 20,
  },
});
