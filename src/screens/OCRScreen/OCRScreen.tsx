import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { MainTabNavigationProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { OCREngine } from "../../services/ocr/OCREngine";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "Urdu" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
];

export const OCRScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [languageHint, setLanguageHint] = useState<string>("en");
  const [showLanguagePicker, setShowLanguagePicker] = useState<boolean>(false);

  const ocrEngine = new OCREngine();

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant gallery access to select images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setExtractedText(""); // Clear previous results
    }
  };

  // Take a photo using camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant camera access to take photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setExtractedText("");
    }
  };

  // Run OCR
  const runOCR = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select an image first.");
      return;
    }

    setIsLoading(true);
    setExtractedText("");
    try {
      const result = await ocrEngine.extractText(imageUri, languageHint);
      setExtractedText(result.text);
    } catch (error: any) {
      Alert.alert(
        "OCR Failed",
        error.message || "An error occurred during OCR.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear image and result
  const clearAll = () => {
    setImageUri(null);
    setExtractedText("");
  };

  // Copy text to clipboard (simplified: we'll just show an alert)
  const copyText = () => {
    if (extractedText) {
      // In real app, use Clipboard API
      Alert.alert("Copied", "Text copied to clipboard!");
    }
  };

  const selectedLanguageLabel =
    LANGUAGES.find((l) => l.code === languageHint)?.label || "English";

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
          OCR
        </Text>
        <TouchableOpacity onPress={clearAll} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Image Preview */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[
                styles.removeImage,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={clearAll}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              { borderColor: theme.colors.border },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={64}
              color={theme.colors.iconSecondary}
            />
            <Text
              style={[
                styles.placeholderText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Select an image to perform OCR
            </Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  { backgroundColor: theme.colors.primarySurface },
                ]}
                onPress={takePhoto}
              >
                <Ionicons
                  name="camera"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.pickerButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Camera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  { backgroundColor: theme.colors.primarySurface },
                ]}
                onPress={pickImage}
              >
                <Ionicons
                  name="images"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.pickerButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Language Selector */}
        <View style={styles.languageSection}>
          <Text
            style={[
              styles.languageLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Language:
          </Text>
          <TouchableOpacity
            style={[
              styles.languagePicker,
              { borderColor: theme.colors.border },
            ]}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <Text
              style={[styles.languagePickerText, { color: theme.colors.text }]}
            >
              {selectedLanguageLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme.colors.iconSecondary}
            />
          </TouchableOpacity>
          {showLanguagePicker && (
            <View
              style={[
                styles.languageList,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    languageHint === lang.code && {
                      backgroundColor: theme.colors.primarySurface,
                    },
                  ]}
                  onPress={() => {
                    setLanguageHint(lang.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Run OCR Button */}
        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: theme.colors.primary }]}
          onPress={runOCR}
          disabled={!imageUri || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.runButtonText}>Run OCR</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {extractedText ? (
          <View
            style={[
              styles.resultsContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
                Extracted Text
              </Text>
              <TouchableOpacity onPress={copyText} style={styles.copyButton}>
                <Ionicons
                  name="copy-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.copyButtonText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Copy
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.resultsScroll}>
              <Text style={[styles.resultsText, { color: theme.colors.text }]}>
                {extractedText}
              </Text>
            </ScrollView>
          </View>
        ) : null}
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
    fontSize: 20,
    fontWeight: "600",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  imagePreview: {
    width: "100%",
    height: 250,
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 12,
  },
  pickerButtons: {
    flexDirection: "row",
    marginTop: 16,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  pickerButtonText: {
    fontWeight: "500",
    marginLeft: 6,
  },
  languageSection: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  languagePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languagePickerText: {
    fontSize: 14,
  },
  languageList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 4,
  },
  languageItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageItemText: {
    fontSize: 14,
  },
  runButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  runButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  resultsContainer: {
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyButtonText: {
    fontWeight: "500",
    marginLeft: 4,
  },
  resultsScroll: {
    maxHeight: 300,
  },
  resultsText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
