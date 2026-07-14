import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  StatusBar,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Routes } from "../../constants/routes";
import { MainTabNavigationProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { searchService } from "../../services/search/SearchService";
import { FileModel } from "../../models/FileModel";
import { fileRepository } from "../../repository/FileRepository";
import { logger } from "../../utils/logger";

export const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Track keyboard visibility
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Perform search with debounce
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const files = await searchService.searchFiles(searchTerm);
      setResults(files);
      logger.debug(
        `Search completed: ${files.length} results for "${searchTerm}"`,
      );
    } catch (error) {
      logger.error("Search error:", error);
      Alert.alert(
        "Search Error",
        "Failed to perform search. Please try again.",
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query change with debounce
  const handleQueryChange = (text: string) => {
    setQuery(text);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (300ms debounce)
    debounceTimer.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setIsLoading(false);
    Keyboard.dismiss();
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  };

  // Handle file press
  const handleFilePress = (file: FileModel) => {
    Keyboard.dismiss();
    navigation.navigate(Routes.PDF_VIEWER, { screen: Routes.PDF_VIEWER, params: {
      fileId: file.id,
      filePath: file.uri, }
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(1) + " GB";
  };

  // Render file item
  const renderFileItem = ({ item }: { item: FileModel }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleFilePress(item)}
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
          {item.pages} pages · {formatFileSize(item.size)}
        </Text>
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="star" size={12} color={theme.colors.warning} />
            <Text
              style={[styles.favoriteText, { color: theme.colors.warning }]}
            >
              Favorite
            </Text>
          </View>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.iconSecondary}
      />
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    if (hasSearched && results.length === 0) {
      return (
        <View
          style={[
            styles.centerContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={64}
            color={theme.colors.iconSecondary}
          />
          <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
            No results found
          </Text>
          <Text
            style={[
              styles.messageSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Try a different search term
          </Text>
        </View>
      );
    }

    if (!query.trim() && !hasSearched) {
      return (
        <View
          style={[
            styles.centerContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={64}
            color={theme.colors.iconSecondary}
          />
          <Text style={[styles.messageTitle, { color: theme.colors.text }]}>
            Search your files
          </Text>
          <Text
            style={[
              styles.messageSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Enter a keyword to find documents
          </Text>
          <Text
            style={[styles.messageHint, { color: theme.colors.textSecondary }]}
          >
            Search by file name, author, or title
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Header with search bar */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.iconSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search files..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus={true}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.iconSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results or empty state */}
      {isLoading ? (
        <View
          style={[
            styles.centerContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.messageText, { color: theme.colors.textSecondary }]}
          >
            Searching...
          </Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderFileItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  messageSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  messageHint: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  messageText: {
    fontSize: 16,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  resultItem: {
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
  favoriteBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  favoriteText: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  separator: {
    height: 10,
  },
});
