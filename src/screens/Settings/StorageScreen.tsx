import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { fileRepository } from "../../repository/FileRepository";
import { logger } from "../../utils/logger";

interface StorageInfo {
  totalFiles: number;
  totalSize: number;
  cacheSize: number;
  documentSize: number;
  extractedTextSize: number;
  aiCacheSize: number;
}

export const StorageScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalFiles: 0,
    totalSize: 0,
    cacheSize: 0,
    documentSize: 0,
    extractedTextSize: 0,
    aiCacheSize: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load storage information
  const loadStorageInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get files from repository
      const files = await fileRepository.getAllFiles();
      const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

      // Calculate cache size (temporary files in cache directory)
      const cacheDir = FileSystem.cacheDirectory || "";
      let cacheSize = 0;
      if (cacheDir) {
        try {
          const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
          for (const file of cacheFiles) {
            const info = await FileSystem.getInfoAsync(cacheDir + file);
            if (info.exists) cacheSize += info.size || 0;
          }
        } catch (e) {
          // Cache directory might not exist or be accessible
          logger.warn("Failed to read cache directory:", e);
        }
      }

      // Document directory size (for PDFs and other documents)
      const docDir = FileSystem.documentDirectory || "";
      let documentSize = 0;
      if (docDir) {
        try {
          const docFiles = await FileSystem.readDirectoryAsync(docDir);
          for (const file of docFiles) {
            // Skip common system files
            if (file.startsWith(".") || file === "Expo" || file === "SQLite")
              continue;
            const info = await FileSystem.getInfoAsync(docDir + file);
            if (info.exists) documentSize += info.size || 0;
          }
        } catch (e) {
          logger.warn("Failed to read document directory:", e);
        }
      }

      // Estimate AI cache size (from ai_metadata, translations, etc.)
      // This is a rough estimate – we could query DB for total size of content fields
      // For now, we'll use a heuristic: assume each AI record is ~5KB
      // In a real app, you'd query the database for total size.
      // Since we don't have a direct DB size query, we'll approximate.
      // We'll use a placeholder value for now.
      const aiCacheSize = 0; // Placeholder – in production, query DB for total text size

      setStorageInfo({
        totalFiles: files.length,
        totalSize,
        cacheSize,
        documentSize,
        extractedTextSize: 0, // We'll approximate from extracted_text table
        aiCacheSize,
      });
    } catch (error) {
      logger.error("Failed to load storage info:", error);
      Alert.alert("Error", "Could not load storage information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadStorageInfo();
  }, [loadStorageInfo]);

  // Format size with appropriate unit
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(1) + " GB";
  };

  // Clear cache
  const clearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "This will delete all temporary files and cached data. Your documents and settings will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              const cacheDir = FileSystem.cacheDirectory || "";
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                let deletedCount = 0;
                for (const file of files) {
                  await FileSystem.deleteAsync(cacheDir + file);
                  deletedCount++;
                }
                Alert.alert(
                  "Cache Cleared",
                  `Deleted ${deletedCount} temporary files.`,
                );
              } else {
                Alert.alert("Info", "No cache directory found.");
              }
              // Reload storage info
              await loadStorageInfo();
            } catch (error) {
              logger.error("Failed to clear cache:", error);
              Alert.alert("Error", "Failed to clear cache. Please try again.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  // Show storage breakdown with progress bars
  const renderStorageBar = (
    label: string,
    value: number,
    total: number,
    color: string,
  ) => {
    if (total === 0) return null;
    const percentage = Math.min((value / total) * 100, 100);
    return (
      <View style={styles.storageBarContainer}>
        <View style={styles.storageBarLabel}>
          <Text
            style={[
              styles.storageBarLabelText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {label}
          </Text>
          <Text style={[styles.storageBarValue, { color: theme.colors.text }]}>
            {formatSize(value)}
          </Text>
        </View>
        <View
          style={[
            styles.storageBarTrack,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <View
            style={[
              styles.storageBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Storage
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading storage info...
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryNumber,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {storageInfo.totalFiles}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Files
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryNumber,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {formatSize(storageInfo.totalSize)}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Total Size
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryNumber,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {formatSize(storageInfo.cacheSize)}
                  </Text>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Cache
                  </Text>
                </View>
              </View>
            </View>

            {/* Storage Breakdown */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Storage Breakdown
            </Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {renderStorageBar(
                "Documents (PDFs)",
                storageInfo.documentSize,
                storageInfo.totalSize + storageInfo.documentSize,
                theme.colors.primary,
              )}
              {renderStorageBar(
                "Extracted Text",
                storageInfo.extractedTextSize,
                storageInfo.totalSize + storageInfo.extractedTextSize,
                theme.colors.secondary,
              )}
              {renderStorageBar(
                "AI Cache",
                storageInfo.aiCacheSize,
                storageInfo.totalSize + storageInfo.aiCacheSize,
                theme.colors.success,
              )}
              {renderStorageBar(
                "Temporary Cache",
                storageInfo.cacheSize,
                storageInfo.totalSize + storageInfo.cacheSize,
                theme.colors.warning,
              )}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
                  Total Used
                </Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>
                  {formatSize(
                    storageInfo.totalSize +
                      storageInfo.cacheSize +
                      storageInfo.documentSize,
                  )}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={clearCache}
              disabled={isClearing}
            >
              {isClearing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Clear Cache</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary, marginTop: 8 },
              ]}
              onPress={() => {
                Alert.alert("Refresh", "Refresh storage information?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Refresh", onPress: loadStorageInfo },
                ]);
              }}
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Refresh Stats</Text>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Clearing cache will remove temporary files and may improve
              performance. Your documents and settings will not be affected.
            </Text>
          </>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  storageBarContainer: {
    marginBottom: 12,
  },
  storageBarLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  storageBarLabelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  storageBarValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  storageBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  storageBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
});
