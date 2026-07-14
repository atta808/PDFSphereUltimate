import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { PDFViewerStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { PDFEditingService } from "../../services/editor/PDFEditingService";
import { fileRepository } from "../../repository/FileRepository";
import { generateUUID } from "../../utils/uuid";

type EditorScreenRouteProp = RouteProp<PDFViewerStackParamList, 'Editor'>;

type EditingAction = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  requiresMultipleFiles?: boolean;
  requiresPageInput?: boolean;
  requiresOrderInput?: boolean;
  requiresSplitRanges?: boolean;
  requiresRotationInput?: boolean;
};

const ACTIONS: EditingAction[] = [
  {
    id: "merge",
    title: "Merge PDFs",
    icon: "git-merge-outline",
    description: "Combine multiple PDFs into one document",
    requiresMultipleFiles: true,
  },
  {
    id: "split",
    title: "Split PDF",
    icon: "cut-outline" as any,
    description: "Split a PDF by page ranges",
    requiresSplitRanges: true,
  },
  {
    id: "rotate",
    title: "Rotate Pages",
    icon: "refresh-outline",
    description: "Rotate selected or all pages",
    requiresRotationInput: true,
  },
  {
    id: "delete",
    title: "Delete Pages",
    icon: "trash-outline",
    description: "Remove selected pages from the PDF",
    requiresPageInput: true,
  },
  {
    id: "reorder",
    title: "Reorder Pages",
    icon: "swap-vertical-outline",
    description: "Change the order of pages",
    requiresOrderInput: true,
  },
];

export const EditorScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<EditorScreenRouteProp>();
  const { fileId } = route.params;

  const editingService = new PDFEditingService();

  // State for modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<EditingAction | null>(
    null,
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [pageInput, setPageInput] = useState("");
  const [splitInput, setSplitInput] = useState("");
  const [reorderInput, setReorderInput] = useState("");
  const [rotationInput, setRotationInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFileName, setOutputFileName] = useState("");

  // Pick files
  const pickFiles = async (multiple: boolean) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple,
      });
      if (result.assets && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri);
        const names = result.assets.map((a) => a.name || "Unnamed.pdf");
        setSelectedFiles(uris);
        setFileNames(names);
      }
    } catch (err) {
      console.error("Error picking files:", err);
      Alert.alert("Error", "Could not select files.");
    }
  };

  // Execute the selected action
  const executeAction = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      let result: string | string[] | undefined;

      switch (selectedAction.id) {
        case "merge":
          if (selectedFiles.length < 2) {
            Alert.alert("Error", "Please select at least two PDFs to merge.");
            setIsProcessing(false);
            return;
          }
          result = await editingService.mergePDFs(
            selectedFiles,
            outputFileName || "Merged.pdf",
          );
          break;

        case "split":
          if (selectedFiles.length !== 1) {
            Alert.alert("Error", "Please select exactly one PDF to split.");
            setIsProcessing(false);
            return;
          }
          // Parse split ranges: e.g., "1-3,4-6,7-9"
          const ranges = splitInput.split(",").map((s) => {
            const parts = s.trim().split("-").map(Number);
            if (
              parts.length !== 2 ||
              isNaN(parts[0]) ||
              isNaN(parts[1]) ||
              parts[0] < 1 ||
              parts[1] < parts[0]
            ) {
              throw new Error('Invalid range format. Use e.g., "1-3,4-6"');
            }
            return { start: parts[0], end: parts[1] };
          });
          result = await editingService.splitPDF(
            selectedFiles[0],
            ranges,
            outputFileName || "Split",
          );
          break;

        case "rotate":
          if (selectedFiles.length !== 1) {
            Alert.alert("Error", "Please select exactly one PDF to rotate.");
            setIsProcessing(false);
            return;
          }
          const degrees = parseInt(rotationInput, 10);
          if (![90, 180, 270].includes(degrees)) {
            Alert.alert("Error", "Please enter 90, 180, or 270.");
            setIsProcessing(false);
            return;
          }
          // Parse page numbers: comma-separated, empty means all
          const pageNums =
            pageInput.trim() === ""
              ? []
              : pageInput
                  .split(",")
                  .map(Number)
                  .filter((n) => n > 0);
          result = await editingService.rotatePDF(
            selectedFiles[0],
            pageNums,
            degrees as 90 | 180 | 270,
            outputFileName || "Rotated.pdf",
          );
          break;

        case "delete":
          if (selectedFiles.length !== 1) {
            Alert.alert(
              "Error",
              "Please select exactly one PDF to delete pages from.",
            );
            setIsProcessing(false);
            return;
          }
          const delPages = pageInput
            .split(",")
            .map(Number)
            .filter((n) => n > 0);
          if (delPages.length === 0) {
            Alert.alert(
              "Error",
              "Please enter at least one page number to delete.",
            );
            setIsProcessing(false);
            return;
          }
          result = await editingService.deletePages(
            selectedFiles[0],
            delPages,
            outputFileName || "Deleted.pdf",
          );
          break;

        case "reorder":
          if (selectedFiles.length !== 1) {
            Alert.alert("Error", "Please select exactly one PDF to reorder.");
            setIsProcessing(false);
            return;
          }
          const order = reorderInput
            .split(",")
            .map(Number)
            .filter((n) => n > 0);
          if (order.length === 0) {
            Alert.alert(
              "Error",
              'Please enter the page order (e.g., "2,3,1").',
            );
            setIsProcessing(false);
            return;
          }
          result = await editingService.reorderPages(
            selectedFiles[0],
            order,
            outputFileName || "Reordered.pdf",
          );
          break;

        default:
          throw new Error("Unknown action");
      }

      setIsProcessing(false);
      setModalVisible(false);
      // Reset state
      setSelectedFiles([]);
      setFileNames([]);
      setPageInput("");
      setSplitInput("");
      setReorderInput("");
      setRotationInput("");
      setOutputFileName("");

      // Show success and navigate to the file manager
      if (result) {
        // If result is a string (single file) or array (multiple files), we could save them to repository.
        // For simplicity, we'll just inform the user and they can navigate to Files tab.
        Alert.alert("Success", "PDF edited successfully!", [
          {
            text: "View Files",
            onPress: () => {
              // Navigate to Files tab (we need to navigate to the main tab)
              navigation.navigate('Files' as never);
            },
          },
          { text: "OK" },
        ]);
      }
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert("Error", `Failed to edit PDF: ${error.message}`);
    }
  };

  // Open modal for action
  const openModalForAction = (action: EditingAction) => {
    setSelectedAction(action);
    setSelectedFiles([]);
    setFileNames([]);
    setPageInput("");
    setSplitInput("");
    setReorderInput("");
    setRotationInput("");
    setOutputFileName("");
    setModalVisible(true);
    // Auto-pick files if needed
    if (action.requiresMultipleFiles) {
      pickFiles(true);
    } else {
      pickFiles(false);
    }
  };

  // Render modal content based on action
  const renderModalContent = () => {
    if (!selectedAction) return null;

    return (
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {selectedAction.title}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={styles.modalBodyContent}
        >
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Selected Files:
          </Text>
          {fileNames.length > 0 ? (
            fileNames.map((name, index) => (
              <Text
                key={index}
                style={[styles.fileName, { color: theme.colors.text }]}
              >
                • {name}
              </Text>
            ))
          ) : (
            <Text
              style={[styles.noFiles, { color: theme.colors.textSecondary }]}
            >
              No files selected.
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.pickButton,
              { backgroundColor: theme.colors.primarySurface },
            ]}
            onPress={() =>
              pickFiles(selectedAction.requiresMultipleFiles || false)
            }
          >
            <Text
              style={[styles.pickButtonText, { color: theme.colors.primary }]}
            >
              {selectedAction.requiresMultipleFiles
                ? "Select PDFs"
                : "Select PDF"}
            </Text>
          </TouchableOpacity>

          {selectedAction.requiresPageInput &&
            selectedAction.id !== "split" && (
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.label, { color: theme.colors.textSecondary }]}
                >
                  Page Numbers (comma-separated, leave blank for all pages):
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="e.g., 1,3,5"
                  placeholderTextColor={theme.colors.textPlaceholder}
                  value={pageInput}
                  onChangeText={setPageInput}
                />
              </View>
            )}

          {selectedAction.id === "split" && (
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                Split Ranges (e.g., "1-3,4-6"):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="e.g., 1-3,4-6,7-9"
                placeholderTextColor={theme.colors.textPlaceholder}
                value={splitInput}
                onChangeText={setSplitInput}
              />
            </View>
          )}

          {selectedAction.id === "rotate" && (
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                Rotation Angle (90, 180, 270):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="90"
                placeholderTextColor={theme.colors.textPlaceholder}
                value={rotationInput}
                onChangeText={setRotationInput}
                keyboardType="numeric"
              />
              <Text
                style={[styles.hint, { color: theme.colors.textSecondary }]}
              >
                Leave page numbers empty to rotate all pages.
              </Text>
            </View>
          )}

          {selectedAction.id === "reorder" && (
            <View style={styles.inputGroup}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                New Order (comma-separated page numbers):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="e.g., 2,3,1,4"
                placeholderTextColor={theme.colors.textPlaceholder}
                value={reorderInput}
                onChangeText={setReorderInput}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Output File Name (optional):
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: theme.colors.border, color: theme.colors.text },
              ]}
              placeholder="e.g., MyNewPDF.pdf"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={outputFileName}
              onChangeText={setOutputFileName}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.executeButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={executeAction}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.executeButtonText}>Execute</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          PDF Editor
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => openModalForAction(action)}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.colors.primarySurface },
              ]}
            >
              <Ionicons
                name={action.icon}
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                {action.title}
              </Text>
              <Text
                style={[
                  styles.actionDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {action.description}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.iconSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal for editing actions */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          {renderModalContent()}
        </View>
      </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalBody: {
    maxHeight: "90%",
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  fileName: {
    fontSize: 14,
    paddingVertical: 2,
  },
  noFiles: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 8,
  },
  pickButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  pickButtonText: {
    fontWeight: "600",
  },
  inputGroup: {
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  executeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  executeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
