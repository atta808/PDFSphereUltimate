import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { PDFDocument } from "@adnsistemas/pdf-lib";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../theme/ThemeContext";
import { Routes } from "../../constants/routes";
import { MainTabNavigationProp } from "../../navigation/types";
import { fileRepository } from "../../repository/FileRepository";
import { generateUUID } from "../../utils/uuid";

type ScanImage = {
  uri: string;
  width: number;
  height: number;
};

export const ScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [images, setImages] = useState<ScanImage[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flash, setFlash] = useState(false);

  const addImages = useCallback((newImages: ScanImage[]) => {
    setImages((current) => [...current, ...newImages]);
  }, []);

  const capturePage = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady) return;

    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (result?.uri) {
        addImages([
          {
            uri: result.uri,
            width: result.width,
            height: result.height,
          },
        ]);
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
      Alert.alert("Capture failed", "Could not capture the page. Please try again.");
    }
  }, [addImages, isCameraReady]);

  const importPages = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        addImages(
          result.assets.map((asset) => ({
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
          })),
        );
      }
    } catch (error) {
      console.error("Image import failed:", error);
      Alert.alert("Import failed", "Could not import the selected images.");
    }
  }, [addImages]);

  const removePage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const createPdf = useCallback(async () => {
    if (images.length === 0) {
      Alert.alert("No pages", "Capture or import at least one page first.");
      return;
    }

    setIsProcessing(true);

    try {
      const pdf = await PDFDocument.create();

      for (const image of images) {
        const source = new File(image.uri);
        const bytes = await source.bytes();
        const isPng = /\.png$/i.test(image.uri);
        const embedded = isPng
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);

        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdf.save();
      const fileId = generateUUID();
      const fileName = `Scan_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
      const output = new File(Paths.document, fileName);

      if (output.exists) {
        output.delete();
      }
      output.create({ overwrite: true });
      output.write(pdfBytes);

      await fileRepository.saveFile({
        id: fileId,
        name: fileName,
        uri: output.uri,
        size: output.size,
        pages: images.length,
        lastModified: new Date(),
        isFavorite: false,
        metadata: {
          title: fileName,
          createdAt: new Date(),
          source: "scanner",
        },
      });

      setImages([]);
      Alert.alert("PDF created", `${fileName} was saved to PDFSphere.`, [
        {
          text: "Open PDF",
          onPress: () =>
            navigation.navigate(Routes.PDF_VIEWER, {
              screen: Routes.PDF_VIEWER,
              params: { fileId, filePath: output.uri },
            }),
        },
        { text: "Done", style: "cancel" },
      ]);
    } catch (error) {
      console.error("PDF creation failed:", error);
      Alert.alert(
        "PDF creation failed",
        error instanceof Error ? error.message : "Could not create the PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [images, navigation]);

  if (!permission) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="camera-outline" size={64} color={theme.colors.iconSecondary} />
        <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
          Camera permission required
        </Text>
        <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
          PDFSphere needs camera access to scan document pages.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#000" }]}>
      <View style={styles.cameraArea}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
          onCameraReady={() => setIsCameraReady(true)}
        />

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Document</Text>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => setFlash((current) => !current)}
          >
            <Ionicons name={flash ? "flash" : "flash-off"} size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.guide}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sideButton} onPress={importPages}>
            <Ionicons name="images-outline" size={28} color="white" />
            <Text style={styles.sideButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={capturePage}
            disabled={!isCameraReady || isProcessing}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <View style={styles.sideButton}>
            <Ionicons name="documents-outline" size={24} color="white" />
            <Text style={styles.sideButtonText}>{images.length} pages</Text>
          </View>
        </View>
      </View>

      {images.length > 0 && (
        <View style={[styles.pagesPanel, { backgroundColor: theme.colors.background }]}>
          <View style={styles.panelHeader}>
            <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
              Pages ({images.length})
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
              onPress={createPdf}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color="white" />
                  <Text style={styles.createButtonText}>Create PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={images}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            contentContainerStyle={styles.thumbnailList}
            renderItem={({ item, index }) => (
              <View style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <View style={styles.thumbnailNumber}>
                  <Text style={styles.thumbnailNumberText}>{index + 1}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePage(index)}
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  cameraArea: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "white", fontSize: 18, fontWeight: "700" },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  guide: {
    position: "absolute",
    top: "22%",
    left: "8%",
    right: "8%",
    bottom: "22%",
  },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 34, height: 34, borderTopWidth: 4, borderLeftWidth: 4, borderColor: "white" },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 34, height: 34, borderTopWidth: 4, borderRightWidth: 4, borderColor: "white" },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 34, height: 34, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: "white" },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 34, height: 34, borderBottomWidth: 4, borderRightWidth: 4, borderColor: "white" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
  },
  sideButton: { width: 72, alignItems: "center" },
  sideButtonText: { color: "white", fontSize: 11, marginTop: 4 },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 5,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "white" },
  pagesPanel: { minHeight: 150, paddingTop: 10, paddingBottom: 8 },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  panelTitle: { fontSize: 16, fontWeight: "700" },
  createButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  createButtonText: { color: "white", fontWeight: "700" },
  thumbnailList: { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  thumbnailWrapper: { width: 82, height: 108, borderRadius: 8, overflow: "hidden" },
  thumbnail: { width: "100%", height: "100%", backgroundColor: "#222" },
  thumbnailNumber: {
    position: "absolute",
    left: 5,
    bottom: 5,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailNumberText: { color: "white", fontSize: 11, fontWeight: "700" },
  removeButton: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permissionTitle: { fontSize: 20, fontWeight: "700", marginTop: 16 },
  permissionText: { fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 20 },
  primaryButton: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 10 },
  primaryButtonText: { color: "white", fontWeight: "700" },
});
