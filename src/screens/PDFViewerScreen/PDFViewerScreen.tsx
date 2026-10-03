import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { PDFViewerNavigationProp, PDFViewerScreenRouteProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import WebView from "react-native-webview";
import { fileRepository } from "../../repository/FileRepository";
import { logger } from "../../utils/logger";
import { PDF_JS_VIEWER_HTML } from "../../services/pdf/pdfJsViewerHtml";

export const PDFViewerScreen: React.FC<{ route: PDFViewerScreenRouteProp }> = ({ route }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<PDFViewerNavigationProp>();
  const webViewRef = useRef<WebView>(null);
  const { fileId, filePath } = route.params || {};

  const [pdfUri, setPdfUri] = useState<string | null>(filePath || null);
  const [pdfName, setPdfName] = useState("Unknown PDF");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      if (fileId) {
        try {
          const file = await fileRepository.getFileById(fileId);
          if (file) {
            setPdfName(file.name);
            setPdfUri(file.uri || null);
          } else {
            setPdfUri(null);
            setIsLoading(false);
          }
        } catch (error) {
          logger.error("Failed to load file info", error);
          setPdfUri(null);
          setIsLoading(false);
        }
      } else if (filePath) {
        setPdfName(filePath.split("/").pop() || "PDF Document");
        setPdfUri(filePath);
      } else {
        setPdfUri(null);
        setIsLoading(false);
      }
    };
    loadFile();
  }, [fileId, filePath]);

  const sendToViewer = useCallback(
    (type: string, payload?: unknown) => {
      if (!webViewRef.current || !isWebViewReady) return false;
      webViewRef.current.postMessage(JSON.stringify({ type, payload }));
      return true;
    },
    [isWebViewReady],
  );

  const loadPdf = useCallback(
    async (uri: string, suppliedPassword: string = "") => {
      try {
        setIsLoading(true);
        setIsError(false);
        const file = new File(uri);
        if (!file.exists) {
          throw new Error("PDF file not found.");
        }
        const base64 = await file.base64();
        setPendingBase64(base64);
        if (isWebViewReady) {
          webViewRef.current?.postMessage(
            JSON.stringify({
              type: "loadPdf",
              payload: base64,
              password: suppliedPassword || undefined,
            }),
          );
        }
      } catch (error) {
        logger.error("Failed to read PDF", error);
        setIsLoading(false);
        setIsError(true);
        Alert.alert("PDF Error", error instanceof Error ? error.message : "Could not read PDF.");
      }
    },
    [isWebViewReady],
  );

  useEffect(() => {
    if (pdfUri && isWebViewReady) {
      void loadPdf(pdfUri, password);
    }
  }, [pdfUri, isWebViewReady, loadPdf]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "ready") {
          setIsWebViewReady(true);
          return;
        }
        if (data.type === "loaded") {
          setTotalPages(data.pageCount || 1);
          setCurrentPage(1);
          setIsLoading(false);
          setIsError(false);
          return;
        }
        if (data.type === "pageChanged") {
          setCurrentPage(data.page || 1);
          return;
        }
        if (data.type === "passwordRequired") {
          setIsLoading(false);
          setIsPasswordModalVisible(true);
          return;
        }
        if (data.type === "error") {
          logger.error("PDF viewer error:", data.payload);
          setIsLoading(false);
          setIsError(true);
          Alert.alert("PDF Error", data.payload || "Failed to load PDF.");
        }
      } catch (error) {
        logger.error("Invalid PDF viewer message", error);
      }
    },
    [],
  );

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPdfName(asset.name || "Selected PDF");
        setPdfUri(asset.uri);
        setCurrentPage(1);
        setTotalPages(1);
      }
    } catch (error) {
      logger.error("Error picking PDF", error);
      Alert.alert("Error", "Could not select PDF file.");
    }
  };

  const updatePage = (page: number) => {
    const next = Math.max(1, Math.min(page, totalPages));
    if (sendToViewer("setPage", next)) setCurrentPage(next);
  };

  const updateScale = (next: number) => {
    const value = Math.max(0.5, Math.min(next, 3));
    setScale(value);
    sendToViewer("setScale", value);
  };

  const submitPassword = () => {
    if (!password.trim() || !pendingBase64) {
      Alert.alert("Password required", "Enter the PDF password.");
      return;
    }
    setIsPasswordModalVisible(false);
    setIsLoading(true);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "loadPdf",
        payload: pendingBase64,
        password,
      }),
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {pdfName}
        </Text>
        <TouchableOpacity onPress={pickPDF} style={styles.headerButton}>
          <Ionicons name="folder-open-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.viewerContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: PDF_JS_VIEWER_HTML, baseUrl: "https://cdnjs.cloudflare.com" }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          allowFileAccess
          style={styles.webView}
        />
        {isLoading && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading PDF...
            </Text>
          </View>
        )}
        {isError && !isLoading && (
          <View style={[styles.errorOverlay, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="alert-circle-outline" size={56} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.text }]}>Failed to load PDF</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={pickPDF}>
              <Text style={styles.retryButtonText}>Choose another PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <View style={styles.controlGroup}>
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.border }]}
            disabled={currentPage <= 1}
            onPress={() => updatePage(currentPage - 1)}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageText, { color: theme.colors.text }]}>
            {currentPage} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.controlButton, { borderColor: theme.colors.border }]}
            disabled={currentPage >= totalPages}
            onPress={() => updatePage(currentPage + 1)}
          >
            <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.controlGroup}>
          <TouchableOpacity style={[styles.controlButton, { borderColor: theme.colors.border }]} onPress={() => updateScale(scale - 0.2)}>
            <Ionicons name="remove-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => updateScale(1)}>
            <Text style={[styles.zoomText, { color: theme.colors.textSecondary }]}>
              {Math.round(scale * 100)}%
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, { borderColor: theme.colors.border }]} onPress={() => updateScale(scale + 0.2)}>
            <Ionicons name="add-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Password Required</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Enter the password for this PDF.
            </Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="PDF password"
              placeholderTextColor={theme.colors.textPlaceholder}
              onSubmitEditing={submitPassword}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsPasswordModalVisible(false)} style={styles.modalAction}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitPassword} style={[styles.modalAction, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.primaryText}>Open</Text>
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  headerButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600", marginHorizontal: 8 },
  viewerContainer: { flex: 1 },
  webView: { flex: 1, backgroundColor: "#f0f0f0" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { marginTop: 12, fontSize: 18, fontWeight: "600" },
  retryButton: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  retryButtonText: { color: "white", fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  controlGroup: { flexDirection: "row", alignItems: "center" },
  controlButton: { width: 40, height: 40, borderWidth: 1, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  pageText: { minWidth: 62, textAlign: "center", marginHorizontal: 10, fontWeight: "600" },
  zoomText: { minWidth: 52, textAlign: "center", marginHorizontal: 8 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modal: { padding: 20, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalSubtitle: { marginTop: 6, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  modalAction: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  primaryText: { color: "white", fontWeight: "700" },
});
