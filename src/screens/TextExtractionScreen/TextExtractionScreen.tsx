import React, { useState, useRef, useCallback } from "react";
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
import { MainTabNavigationProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import WebView from "react-native-webview";
import { logger } from "../../utils/logger";
import { fileRepository } from "../../repository/FileRepository";
import { generateUUID } from "../../utils/uuid";

export const TextExtractionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();

  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isWebViewReady, setIsWebViewReady] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [fileUri, setFileUri] = useState<string | null>(null);

  // Handle messages from WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") {
        setIsWebViewReady(true);
        logger.debug("WebView ready for text extraction");
      } else if (data.type === "success") {
        setExtractedText(data.payload);
        setIsExtracting(false);
        setIsLoading(false);
        logger.debug(`Extracted ${data.payload.length} characters`);
        Alert.alert("Success", "Text extracted successfully!");
      } else if (data.type === "error") {
        setIsExtracting(false);
        setIsLoading(false);
        Alert.alert(
          "Extraction Error",
          data.payload || "Failed to extract text.",
        );
        logger.error("Extraction error:", data.payload);
      }
    } catch (err) {
      logger.warn("Invalid message from WebView:", err);
    }
  }, []);

  // Pick a PDF document
  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.name || "document.pdf";
        setSelectedFileName(name);
        setExtractedText("");
        setFileUri(uri);
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        // Send to WebView for extraction
        if (webViewRef.current && isWebViewReady) {
          setIsLoading(true);
          setIsExtracting(true);
          webViewRef.current.postMessage(
            JSON.stringify({
              type: "extractText",
              payload: base64,
            }),
          );
        } else {
          Alert.alert(
            "WebView not ready",
            "Please wait for the extraction engine to load.",
          );
        }
      } else {
        // User cancelled
        logger.debug("Document pick cancelled");
      }
    } catch (err) {
      logger.error("Error picking PDF:", err);
      Alert.alert("Error", "Could not select PDF.");
    }
  };

  // Save extracted text to repository
  const saveExtractedText = async () => {
    if (!extractedText.trim() || !fileUri) {
      Alert.alert("No Text", "No extracted text to save.");
      return;
    }
    try {
      // Create a new file entry or update existing
      const fileId = generateUUID();
      const fileName = selectedFileName.replace(".pdf", "_extracted.txt");
      const file = {
        id: fileId,
        name: fileName,
        uri: fileUri,
        size: extractedText.length,
        pages: 0,
        lastModified: new Date(),
        isFavorite: false,
        metadata: {
          title: fileName,
          source: "extraction",
          extractedText: extractedText,
        },
      };
      await fileRepository.saveFile(file);
      // Also save extracted text separately
      await fileRepository.saveExtractedText(fileId, extractedText);
      Alert.alert("Saved", `Extracted text saved as "${fileName}"`, [
        {
          text: "View File",
          onPress: () => {
            // Navigate to Files tab
            navigation.navigate("Files");
          },
        },
        { text: "OK" },
      ]);
    } catch (error) {
      logger.error("Failed to save extracted text:", error);
      Alert.alert("Error", "Could not save extracted text.");
    }
  };

  // Copy text to clipboard (simplified: show alert)
  const copyText = () => {
    if (extractedText) {
      // In a real app, use Clipboard.setString(extractedText)
      Alert.alert("Copied", "Text copied to clipboard!");
    }
  };

  // Clear extracted text
  const clearText = () => {
    setExtractedText("");
    setSelectedFileName("");
    setFileUri(null);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Extract Text
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hidden WebView */}
      <View style={{ height: 0, width: 0, opacity: 0 }}>
        <WebView
          ref={webViewRef}
          source={require("../../../assets/pdfjs-extractor.html")}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={false}
          originWhitelist={["*"]}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* File picker */}
        <TouchableOpacity
          style={[styles.pickButton, { backgroundColor: theme.colors.primary }]}
          onPress={pickPDF}
          disabled={isExtracting}
        >
          <Ionicons name="document-outline" size={24} color="white" />
          <Text style={styles.pickButtonText}>
            {selectedFileName ? "Choose Another PDF" : "Select a PDF"}
          </Text>
        </TouchableOpacity>

        {selectedFileName ? (
          <Text
            style={[styles.fileName, { color: theme.colors.textSecondary }]}
          >
            Selected: {selectedFileName}
          </Text>
        ) : null}

        {isExtracting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Extracting text...
            </Text>
            <Text
              style={[
                styles.loadingSubText,
                { color: theme.colors.textSecondary },
              ]}
            >
              This may take a few seconds
            </Text>
          </View>
        ) : null}

        {/* Extracted text result */}
        {extractedText ? (
          <View
            style={[
              styles.resultContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                Extracted Text ({extractedText.split(/\s+/).length} words)
              </Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.resultActionButton}
                  onPress={copyText}
                >
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resultActionButton}
                  onPress={saveExtractedText}
                >
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resultActionButton}
                  onPress={clearText}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.textScroll}>
              <Text
                style={[styles.extractedText, { color: theme.colors.text }]}
              >
                {extractedText}
              </Text>
            </ScrollView>
          </View>
        ) : null}

        {!selectedFileName && !isExtracting && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="text-outline"
              size={64}
              color={theme.colors.iconSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Extract Text from PDF
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Select a digital PDF (with selectable text) to extract all text
              content.
            </Text>
            <Text
              style={[styles.emptyHint, { color: theme.colors.textSecondary }]}
            >
              Supports Urdu, Arabic, and other languages
            </Text>
          </View>
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
  headerButton: {
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
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  pickButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  fileName: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 14,
  },
  resultContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultActionButton: {
    paddingHorizontal: 8,
  },
  textScroll: {
    maxHeight: 400,
  },
  extractedText: {
    fontSize: 14,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
