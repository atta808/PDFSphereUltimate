import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Routes } from "../../constants/routes";
import { MainTabNavigationProp } from "../../navigation/types";
import { FileModel } from "../../models/FileModel";
import { fileRepository } from "../../repository/FileRepository";
import { Ionicons } from "@expo/vector-icons";

type SortOption = "name" | "date" | "size";

export const FileManagerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();

  const [files, setFiles] = useState<FileModel[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("date");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Load files
  const loadFiles = useCallback(async () => {
    try {
      const data = await fileRepository.getAllFiles();
      setFiles(data);
      applyFiltersAndSort(data, searchQuery, sortOption);
    } catch (error) {
      console.error("Failed to load files:", error);
      Alert.alert("Error", "Could not load files. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, sortOption]);

  // Apply filters and sorting
  const applyFiltersAndSort = (
    fileList: FileModel[],
    query: string,
    sort: SortOption,
  ) => {
    let result = [...fileList];

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim();
      result = result.filter(
        (file) =>
          file.name.toLowerCase().includes(lowerQuery) ||
          file.metadata?.author?.toLowerCase().includes(lowerQuery) ||
          file.metadata?.title?.toLowerCase().includes(lowerQuery),
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return b.lastModified.getTime() - a.lastModified.getTime();
        case "size":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    setFilteredFiles(result);
  };

  // Handle search input
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFiltersAndSort(files, text, sortOption);
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setShowSortMenu(false);
    applyFiltersAndSort(files, searchQuery, option);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (file: FileModel) => {
    try {
      await fileRepository.toggleFavorite(file.id);
      // Refresh local state
      const updatedFiles = files.map((f) =>
        f.id === file.id ? { ...f, isFavorite: !f.isFavorite } : f,
      );
      setFiles(updatedFiles);
      applyFiltersAndSort(updatedFiles, searchQuery, sortOption);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      Alert.alert("Error", "Could not update favorite status.");
    }
  };

  // Handle file press
  const handleFilePress = (file: FileModel) => {
    navigation.navigate(Routes.PDF_VIEWER, { screen: Routes.PDF_VIEWER, params: {
      fileId: file.id,
      filePath: file.uri, }
    });
  };

  // Handle delete
  const handleDeleteFile = (file: FileModel) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fileRepository.deleteFile(file.id);
              // Remove from state
              const updatedFiles = files.filter((f) => f.id !== file.id);
              setFiles(updatedFiles);
              applyFiltersAndSort(updatedFiles, searchQuery, sortOption);
            } catch (error) {
              console.error("Failed to delete file:", error);
              Alert.alert("Error", "Could not delete file.");
            }
          },
        },
      ],
    );
  };

  // Handle long press for quick actions
  const handleLongPress = (file: FileModel) => {
    setSelectedFileId(file.id);
    Alert.alert(file.name, "Choose an action", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Favorite",
        onPress: () => handleToggleFavorite(file),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteFile(file),
      },
    ]);
  };

  // Initial load
  useEffect(() => {
    loadFiles();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadFiles();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(1) + " GB";
  };

  // Format date
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Render sort menu
  const renderSortMenu = () => {
    if (!showSortMenu) return null;
    return (
      <Modal transparent animationType="fade" visible={showSortMenu}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View
            style={[
              styles.sortMenu,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {(["name", "date", "size"] as SortOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortMenuItem,
                  sortOption === option && {
                    backgroundColor: theme.colors.primarySurface,
                  },
                ]}
                onPress={() => handleSortChange(option)}
              >
                <Text
                  style={[
                    styles.sortMenuItemText,
                    { color: theme.colors.text },
                  ]}
                >
                  Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                {sortOption === option && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Render empty state
  if (!isLoading && filteredFiles.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Files
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.SCANNER)}>
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
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
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search files..."
              placeholderTextColor={theme.colors.textPlaceholder}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
        </View>
        <View
          style={[
            styles.emptyContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="documents-outline"
            size={80}
            color={theme.colors.iconSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {searchQuery ? "No results found" : "No Files Yet"}
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {searchQuery
              ? "Try a different search term"
              : "Scan a document or import a PDF to get started"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={[
                styles.emptyButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => navigation.navigate(Routes.SCANNER)}
            >
              <Text style={styles.emptyButtonText}>Scan Document</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Files
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSortMenu(true)}
            style={styles.headerButton}
          >
            <Ionicons
              name="funnel-outline"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate(Routes.SCANNER)}
            style={styles.headerButton}
          >
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Menu */}
      {renderSortMenu()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.iconSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search files..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.iconSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* File List */}
      {isLoading ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.fileItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => handleFilePress(item)}
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.fileIcon,
                  { backgroundColor: theme.colors.primarySurface },
                ]}
              >
                <Ionicons
                  name="document-text"
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.fileInfo}>
                <Text
                  style={[styles.fileName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={styles.fileMetaRow}>
                  <Text
                    style={[
                      styles.fileMeta,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.pages} pages
                  </Text>
                  <Text
                    style={[
                      styles.fileMetaDot,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    ·
                  </Text>
                  <Text
                    style={[
                      styles.fileMeta,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {formatFileSize(item.size)}
                  </Text>
                  <Text
                    style={[
                      styles.fileMetaDot,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    ·
                  </Text>
                  <Text
                    style={[
                      styles.fileMeta,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {formatDate(item.lastModified)}
                  </Text>
                </View>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => handleToggleFavorite(item)}
                >
                  <Ionicons
                    name={item.isFavorite ? "star" : "star-outline"}
                    size={22}
                    color={
                      item.isFavorite
                        ? theme.colors.warning
                        : theme.colors.iconSecondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => handleDeleteFile(item)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={theme.colors.iconSecondary}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  sortMenu: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sortMenuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sortMenuItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  fileMeta: {
    fontSize: 13,
    fontWeight: "400",
  },
  fileMetaDot: {
    fontSize: 13,
    marginHorizontal: 4,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  favoriteButton: {
    padding: 4,
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
