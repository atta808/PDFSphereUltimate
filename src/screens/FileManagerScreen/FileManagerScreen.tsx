import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { Routes } from "../../constants/routes";
import { MainTabNavigationProp } from "../../navigation/types";
import { FileModel } from "../../models/FileModel";
import { FolderModel } from "../../models/FolderModel";
import { documentService } from "../../services/documents/DocumentService";
import { folderService } from "../../services/documents/FolderService";

type LibraryView = "all" | "recent" | "favorites";

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDate = (date: Date): string => {
  const diff = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const FileManagerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();

  const [files, setFiles] = useState<FileModel[]>([]);
  const [folders, setFolders] = useState<FolderModel[]>([]);
  const [view, setView] = useState<LibraryView>("all");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [folderParentId, setFolderParentId] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      const [allFiles, rootFolders] = await Promise.all([
        documentService.list(),
        folderService.list(null),
      ]);
      setFiles(allFiles);
      setFolders(rootFolders);
    } catch (error) {
      console.error("Failed to load document workspace:", error);
      Alert.alert("Error", "Could not load your documents. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkspace();
    }, [loadWorkspace]),
  );

  const visibleFiles = useMemo(() => {
    let result = files;

    if (view === "recent") {
      result = [...result].sort(
        (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
      ).slice(0, 20);
    } else if (view === "favorites") {
      result = result.filter((file) => file.isFavorite);
    }

    if (currentFolderId !== null) {
      result = result.filter((file) => file.folderId === currentFolderId);
    } else if (view === "all") {
      result = result.filter((file) => !file.folderId);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          file.metadata?.title?.toLowerCase().includes(query) ||
          file.metadata?.author?.toLowerCase().includes(query),
      );
    }

    return [...result].sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );
  }, [files, view, currentFolderId, searchQuery]);

  const currentFolder = currentFolderId
    ? folders.find((folder) => folder.id === currentFolderId)
    : undefined;

  const handleOpen = (file: FileModel) => {
    navigation.navigate(Routes.PDF_VIEWER_STACK, {
      screen: Routes.PDF_VIEWER,
      params: { fileId: file.id, filePath: file.uri },
    });
  };

  const handleFavorite = async (file: FileModel) => {
    try {
      await documentService.toggleFavorite(file.id);
      setFiles((current) =>
        current.map((item) =>
          item.id === file.id ? { ...item, isFavorite: !item.isFavorite } : item,
        ),
      );
    } catch {
      Alert.alert("Error", "Could not update favorite status.");
    }
  };

  const handleDelete = (file: FileModel) => {
    Alert.alert(
      "Delete document",
      `Delete "${file.name}"? The document and its saved AI/extraction data will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await documentService.remove(file.id);
              setFiles((current) => current.filter((item) => item.id !== file.id));
            } catch {
              Alert.alert("Error", "Could not delete the document.");
            }
          },
        },
      ],
    );
  };

  const openRename = (file: FileModel) => {
    setRenameFileId(file.id);
    setTextValue(file.name.replace(/\.pdf$/i, ""));
    setShowRename(true);
  };

  const saveRename = async () => {
    if (!renameFileId || !textValue.trim()) return;
    try {
      const name = textValue.trim().toLowerCase().endsWith(".pdf")
        ? textValue.trim()
        : `${textValue.trim()}.pdf`;
      await documentService.rename(renameFileId, name);
      setFiles((current) =>
        current.map((item) =>
          item.id === renameFileId ? { ...item, name } : item,
        ),
      );
      setShowRename(false);
    } catch {
      Alert.alert("Error", "Could not rename the document.");
    }
  };

  const handleMove = (file: FileModel) => {
    const choices = [
      {
        text: "Workspace root",
        onPress: async () => {
          await documentService.moveToFolder(file.id, null);
          setFiles((current) =>
            current.map((item) =>
              item.id === file.id ? { ...item, folderId: undefined } : item,
            ),
          );
        },
      },
      ...folders.map((folder) => ({
        text: folder.name,
        onPress: async () => {
          await documentService.moveToFolder(file.id, folder.id);
          setFiles((current) =>
            current.map((item) =>
              item.id === file.id ? { ...item, folderId: folder.id } : item,
            ),
          );
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ];

    Alert.alert("Move document", "Choose a destination", choices);
  };

  const handleDocumentMenu = (file: FileModel) => {
    Alert.alert(file.name, "Document actions", [
      { text: "Open", onPress: () => handleOpen(file) },
      {
        text: file.isFavorite ? "Remove Favorite" : "Add to Favorites",
        onPress: () => handleFavorite(file),
      },
      { text: "Rename", onPress: () => openRename(file) },
      { text: "Move to Folder", onPress: () => handleMove(file) },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(file) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const createFolder = async () => {
    if (!textValue.trim()) return;
    try {
      const folder = await folderService.create(textValue, folderParentId);
      if (folder.parentId === null) {
        setFolders((current) =>
          [...current, folder].sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setTextValue("");
      setShowCreateFolder(false);
    } catch {
      Alert.alert("Error", "Could not create the folder.");
    }
  };

  const openCreateFolder = () => {
    setFolderParentId(currentFolderId);
    setTextValue("");
    setShowCreateFolder(true);
  };

  const renderFolder = ({ item }: { item: FolderModel }) => (
    <TouchableOpacity
      style={[
        styles.folderCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
      ]}
      onPress={async () => {
        setCurrentFolderId(item.id);
        setView("all");
        const children = await folderService.list(item.id);
        if (children.length) {
          // Root navigation is intentionally kept simple in this first workspace slice.
          // Child folders can be promoted to the root folder collection in a later UI pass.
        }
      }}
    >
      <View
        style={[
          styles.folderIcon,
          { backgroundColor: theme.colors.primarySurface },
        ]}
      >
        <Ionicons name="folder" size={22} color={theme.colors.primary} />
      </View>
      <Text
        style={[styles.folderName, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFile = ({ item }: { item: FileModel }) => (
    <TouchableOpacity
      style={[
        styles.fileCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
      ]}
      onPress={() => handleOpen(item)}
      onLongPress={() => handleDocumentMenu(item)}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.pdfIcon,
          { backgroundColor: theme.colors.primarySurface },
        ]}
      >
        <Ionicons name="document-text" size={26} color={theme.colors.primary} />
      </View>

      <View style={styles.fileBody}>
        <Text
          style={[styles.fileName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.fileMeta, { color: theme.colors.textSecondary }]}>
          {item.pages} pages · {formatFileSize(item.size)} · {formatDate(item.lastModified)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => handleFavorite(item)}
        accessibilityLabel={item.isFavorite ? "Remove favorite" : "Add favorite"}
      >
        <Ionicons
          name={item.isFavorite ? "star" : "star-outline"}
          size={20}
          color={item.isFavorite ? theme.colors.warning : theme.colors.iconSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => handleDocumentMenu(item)}
        accessibilityLabel="Document actions"
      >
        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.iconSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading workspace…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
            DOCUMENT WORKSPACE
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {currentFolder?.name ?? "My Documents"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {visibleFiles.length} {visibleFiles.length === 1 ? "document" : "documents"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate(Routes.SCANNER)}
        >
          <Ionicons name="add" size={25} color={theme.colors.primaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="search" size={19} color={theme.colors.iconSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents..."
            placeholderTextColor={theme.colors.textPlaceholder}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={19} color={theme.colors.iconSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.folderAddButton, { borderColor: theme.colors.border }]}
          onPress={openCreateFolder}
        >
          <Ionicons name="folder-open-outline" size={21} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        {([
          ["all", "All"],
          ["recent", "Recent"],
          ["favorites", "Favorites"],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.segment,
              view === key && { backgroundColor: theme.colors.primarySurface },
            ]}
            onPress={() => {
              setView(key);
              setCurrentFolderId(null);
            }}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    view === key ? theme.colors.primary : theme.colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === "all" && currentFolderId === null && folders.length > 0 && (
        <FlatList
          data={folders}
          renderItem={renderFolder}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderList}
        />
      )}

      {currentFolderId !== null && (
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => setCurrentFolderId(null)}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            All folders
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={visibleFiles}
        renderItem={renderFile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await loadWorkspace();
            }}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primarySurface },
              ]}
            >
              <Ionicons name="documents-outline" size={34} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {searchQuery ? "No matching documents" : "Your workspace is empty"}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery
                ? "Try another search term."
                : "Scan a document or import a PDF to start building your library."}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.primaryAction, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate(Routes.SCANNER)}
              >
                <Ionicons name="scan-outline" size={18} color={theme.colors.primaryText} />
                <Text style={[styles.primaryActionText, { color: theme.colors.primaryText }]}>
                  Scan Document
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showCreateFolder || showRename}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCreateFolder(false);
          setShowRename(false);
        }}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {showRename ? "Rename document" : "New folder"}
            </Text>
            <TextInput
              autoFocus
              style={[
                styles.modalInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
              value={textValue}
              onChangeText={setTextValue}
              placeholder={showRename ? "Document name" : "Folder name"}
              placeholderTextColor={theme.colors.textPlaceholder}
              onSubmitEditing={showRename ? saveRename : createFolder}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowCreateFolder(false);
                  setShowRename(false);
                }}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: theme.colors.primary }]}
                onPress={showRename ? saveRename : createFolder}
              >
                <Text style={[styles.modalSaveText, { color: theme.colors.primaryText }]}>
                  {showRename ? "Save" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1 },
  title: { fontSize: 28, fontWeight: "800", marginTop: 3 },
  subtitle: { fontSize: 13, marginTop: 3 },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 9, paddingVertical: 8 },
  folderAddButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "transparent",
  },
  segment: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 6,
  },
  segmentText: { fontSize: 13, fontWeight: "700" },
  folderList: { paddingHorizontal: 20, paddingVertical: 12 },
  folderCard: {
    width: 128,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginRight: 10,
  },
  folderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  folderName: { fontSize: 13, fontWeight: "700" },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  backText: { fontSize: 13, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, flexGrow: 1 },
  fileCard: {
    minHeight: 76,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileBody: { flex: 1, minWidth: 0 },
  fileName: { fontSize: 15, fontWeight: "700" },
  fileMeta: { fontSize: 11.5, marginTop: 5 },
  iconButton: { padding: 7, marginLeft: 2 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingTop: 70 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: 18, textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: "center" },
  primaryAction: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryActionText: { fontSize: 14, fontWeight: "800" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 420, borderRadius: 18, padding: 20 },
  modalTitle: { fontSize: 19, fontWeight: "800", marginBottom: 14 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 18, gap: 10 },
  modalCancel: { paddingHorizontal: 14, paddingVertical: 11 },
  modalCancelText: { fontSize: 14, fontWeight: "700" },
  modalSave: { paddingHorizontal: 17, paddingVertical: 11, borderRadius: 11 },
  modalSaveText: { fontSize: 14, fontWeight: "800" },
});
