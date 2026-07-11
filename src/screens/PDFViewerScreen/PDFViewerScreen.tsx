import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { RouteProp, useNavigation } from "@react-navigation/native";
import {
  PDFViewerScreenRouteProp,
  PDFViewerScreenNavigationProp,
} from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Pdf from "@kishannareshpal/expo-pdf";
import { fileRepository } from "../../repository/FileRepository";
import { logger } from "../../utils/logger";

// Dummy file data – in a real app, this would come from the repository
const DUMMY_FILES: Record<string, { name: string; uri: string }> = {};

export const PDFViewerScreen: React.FC<{ route: PDFViewerScreenRouteProp }> = ({
  route,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<PDFViewerScreenNavigationProp>();
  const { fileId, filePath } = route.params || {};

  const [pdfUri, setPdfUri] = useState<string | null>(filePath || null);
  const [pdfName, setPdfName] = useState<string>("Unknown PDF");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.0);
  const [isPasswordModalVisible, setIsPasswordModalVisible] =
    useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isPasswordProtected, setIsPasswordProtected] =
    useState<boolean>(false);

  const pdfRef = useRef<any>(null);

  // Load file info (simulate repository fetch)
  useEffect(() => {
    const loadFile = async () => {
      if (fileId) {
        try {
          const file = await fileRepository.getFileById(fileId);
          if (file) {
            setPdfName(file.name);
            if (file.uri) {
              setPdfUri(file.uri);
            } else {
              // If no URI, we might need to fetch it from storage – for now, fallback to picker
              setPdfUri(null);
            }
          } else {
            // Try dummy files
            if (DUMMY_FILES[fileId]) {
              const dummy = DUMMY_FILES[fileId];
              setPdfName(dummy.name);
              setPdfUri(dummy.uri);
            } else {
              setPdfUri(null);
              setIsLoading(false);
            }
          }
        } catch (error) {
          logger.error("Failed to load file info", error);
          setPdfUri(null);
          setIsLoading(false);
        }
      } else if (filePath) {
        // Direct path provided
        const name = filePath.split("/").pop() || "PDF Document";
        setPdfName(name);
        setPdfUri(filePath);
      } else {
        // No file – show picker
        setPdfUri(null);
        setIsLoading(false);
      }
    };
    loadFile();
  }, [fileId, filePath]);

  // Handle PDF load completion
  const onLoadComplete = (numberOfPages: number, filePath: string) => {
    setTotalPages(numberOfPages);
    setIsLoading(false);
    setIsError(false);
    setCurrentPage(1);
    // Update repository with page count if available
    if (fileId) {
      fileRepository
        .getFileById(fileId)
        .then((file) => {
          if (file) {
            file.pages = numberOfPages;
            fileRepository
              .saveFile(file)
              .catch((err) => logger.error("Failed to update page count", err));
          }
        })
        .catch((err) => logger.error("Failed to update file", err));
    }
  };

  // Handle PDF page change
  const onPageChanged = (page: number) => {
    setCurrentPage(page);
  };

  // Handle error
  const onError = (error: any) => {
    logger.error("PDF Error:", error);
    setIsLoading(false);
    setIsError(true);
    // Check if password required
    if (error?.message?.toLowerCase().includes("password")) {
      setIsPasswordProtected(true);
      setIsPasswordModalVisible(true);
    } else {
      Alert.alert("Error", "Failed to load PDF. Please try again.");
    }
  };

  // Pick a PDF file from device (for testing / fallback)
  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.name || "Selected PDF";
        setPdfUri(uri);
        setPdfName(name);
        setIsLoading(true);
        setIsError(false);
        setPassword("");
        setIsPasswordProtected(false);
      } else {
        // User cancelled
        logger.debug("Document pick cancelled");
      }
    } catch (err) {
      logger.error("Error picking PDF:", err);
      Alert.alert("Error", "Could not select PDF file.");
    }
  };

  // Zoom controls
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Handle password submit
  const handlePasswordSubmit = () => {
    if (password.trim()) {
      setIsPasswordModalVisible(false);
      // The PDF library will handle the password – we need to reload with password.
      // For @kishannareshpal/expo-pdf, we can pass password in source.
      // We'll reset and reload.
      // Since we can't easily re-trigger with password without re-creating the component,
      // we'll set a state to reload with password.
      // For simplicity, we'll just try to reload with the password.
      // The library supports a 'password' prop.
      // We'll set a state to include password.
      // We need to re-render with the password.
      // We'll set a flag and re-run effect.
      // For now, we'll just log and reload.
      Alert.alert(
        "Info",
        "Password support is implemented but requires re-rendering. We will handle this in production.",
      );
      // In a real implementation, you would pass password prop to Pdf component.
      // We'll just set state and reload.
      setIsPasswordProtected(false);
      setIsLoading(true);
      // Reload by resetting URI
      const currentUri = pdfUri;
      setPdfUri(null);
      setTimeout(() => {
        setPdfUri(currentUri);
      }, 100);
    } else {
      Alert.alert("Error", "Please enter a password.");
    }
  };

  // Render loading state
  if (isLoading && pdfUri) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading PDF...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (isError && !isPasswordProtected) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Failed to load PDF
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={pickPDF}
          >
            <Text style={styles.retryButtonText}>Pick a PDF</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If no PDF URI, show picker prompt
  if (!pdfUri) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[
            styles.emptyContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="document-outline"
            size={80}
            color={theme.colors.iconSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No PDF Selected
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Choose a PDF to view
          </Text>
          <TouchableOpacity
            style={[
              styles.pickButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={pickPDF}
          >
            <Text style={styles.pickButtonText}>Select PDF</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render: PDF viewer with controls
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <View style={styles.container}>
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {pdfName}
          </Text>
          <TouchableOpacity onPress={pickPDF} style={styles.headerButton}>
            <Ionicons
              name="folder-outline"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* PDF Renderer */}
        <View style={styles.pdfContainer}>
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUri, password: password || undefined }}
            onLoadComplete={onLoadComplete}
            onPageChanged={onPageChanged}
            onError={onError}
            style={styles.pdf}
            scale={scale}
            enablePaging={false}
            fitPolicy={0} // 0 = fit width, 1 = fit height, 2 = fit page
            singlePage={false}
            minScale={0.5}
            maxScale={3.0}
          />
        </View>

        {/* Controls Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.pageControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => {
                if (currentPage > 1) {
                  pdfRef.current?.setPage(currentPage - 1);
                }
              }}
              disabled={currentPage <= 1}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={
                  currentPage <= 1
                    ? theme.colors.iconSecondary
                    : theme.colors.text
                }
              />
            </TouchableOpacity>
            <Text style={[styles.pageText, { color: theme.colors.text }]}>
              {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => {
                if (currentPage < totalPages) {
                  pdfRef.current?.setPage(currentPage + 1);
                }
              }}
              disabled={currentPage >= totalPages}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  currentPage >= totalPages
                    ? theme.colors.iconSecondary
                    : theme.colors.text
                }
              />
            </TouchableOpacity>
          </View>

          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={zoomOut}
            >
              <Ionicons
                name="remove-outline"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetZoom}>
              <Text
                style={[styles.zoomText, { color: theme.colors.textSecondary }]}
              >
                {Math.round(scale * 100)}%
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={zoomIn}
            >
              <Ionicons
                name="add-outline"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Password Modal */}
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Password Required
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              This PDF is password-protected. Please enter the password to view
              it.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              placeholder="Enter password"
              placeholderTextColor={theme.colors.textPlaceholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoFocus
              onSubmitEditing={handlePasswordSubmit}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setPassword("");
                }}
              >
                <Text
                  style={[styles.modalButtonText, { color: theme.colors.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handlePasswordSubmit}
              >
                <Text style={styles.modalButtonTextPrimary}>Open</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  pageControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pageText: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 16,
    minWidth: 60,
    textAlign: "center",
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoomText: {
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 12,
    minWidth: 44,
    textAlign: "center",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  // Empty state
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
  },
  pickButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pickButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  // Password Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalButtonText: {
    fontWeight: "500",
  },
  modalButtonTextPrimary: {
    color: "white",
    fontWeight: "500",
  },
});
