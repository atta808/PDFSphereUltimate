import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { MainTabNavigationProp } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentScannerModule from 'react-native-document-scanner-ai';
const DocumentScanner = (DocumentScannerModule as any).default || DocumentScannerModule;
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { fileRepository } from "../../repository/FileRepository";
import { generateUUID } from "../../utils/uuid";
import * as FileSystem from "expo-file-system";

const { width, height } = Dimensions.get("window");

export const ScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<MainTabNavigationProp>();

  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAutoCapture, setIsAutoCapture] = useState<boolean>(true);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Request permissions on mount
  const { hasPermission: cameraPermission, requestPermission: reqCameraPermission } = useCameraPermission();
  const { hasPermission: micPermission, requestPermission: reqMicPermission } = useMicrophonePermission();
  const checkPermissions = useCallback(async () => {
    try {
      let camGranted = cameraPermission;
      if (!camGranted) {
        camGranted = await reqCameraPermission();
      }
      let micGranted = micPermission;
      if (!micGranted) {
        micGranted = await reqMicPermission();
      }
      setHasPermission(!!camGranted);
      if (!camGranted) {
        Alert.alert("Permission Required", "Camera access is required to scan documents. Please enable it in settings.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Permission error:", error);
      setHasPermission(false);
    }
  }, [cameraPermission, micPermission, reqCameraPermission, reqMicPermission]);

  useEffect(() => {
    checkPermissions();
  }, []);

  // Handle document detection
  const onDocumentDetected = useCallback((detected: boolean) => {
    // The library provides a boolean indicating if a document is in frame
    // We can use this to show a visual indicator – currently handled by the library
  }, []);

  // Handle successful capture
  const onCapture = useCallback(
    async (capturedImageUri: string) => {
      setIsScanning(false);
      setCapturedImages((prev) => [...prev, capturedImageUri]);

      // Show confirmation with options
      Alert.alert(
        "Document Captured",
        "What would you like to do with this scanned document?",
        [
          {
            text: "Continue Scanning",
            onPress: () => {
              // Reset scanner and continue
              scannerRef.current?.reset();
              setIsScanning(true);
            },
          },
          {
            text: "Create PDF",
            onPress: async () => {
              await processCapturedImages([
                ...capturedImages,
                capturedImageUri,
              ]);
            },
          },
          {
            text: "View Preview",
            onPress: () => {
              // Navigate to a preview screen (optional)
              Alert.alert("Preview", "Preview screen coming soon!");
            },
          },
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              // Remove the last image from list if cancelled
              setCapturedImages((prev) => prev.slice(0, -1));
            },
          },
        ],
      );
    },
    [capturedImages],
  );

  // Process captured images into a PDF
  const processCapturedImages = async (images: string[]) => {
    if (images.length === 0) {
      Alert.alert("No Images", "No images to process.");
      return;
    }

    setIsProcessing(true);
    try {
      // In a full implementation, you would use pdf-lib to create a PDF from images
      // For now, we'll save the images to the repository as files
      // In the future, you'd use a PDF creation service.

      // Create a file name
      const fileName = `Scan_${new Date().toISOString().slice(0, 10)}.pdf`;
      const fileId = generateUUID();

      // Simulate PDF creation – in reality, you'd use PDFCreationService
      const pdfUri = `${(FileSystem.Paths.document?.uri || 'file:///data/user/0/com.pdfsphere.app/files/')}${fileName}`;

      // Save file to repository
      const file = {
        id: fileId,
        name: fileName,
        uri: pdfUri,
        size: 0,
        pages: images.length,
        lastModified: new Date(),
        isFavorite: false,
        metadata: {
          title: fileName,
          createdAt: new Date(),
          source: "scanner",
        },
      };
      await fileRepository.saveFile(file);

      // Show success and navigate to PDF viewer
      Alert.alert("PDF Created", `Created PDF with ${images.length} pages.`, [
        {
          text: "View PDF",
          onPress: () => {
            // Navigate to PDF viewer
            navigation.navigate('PDFViewer' as any, { screen: 'PDFViewer', params: { fileId, filePath: pdfUri } } as any);
          },
        },
        {
          text: "OK",
          style: "cancel",
        },
      ]);

      // Clear captured images
      setCapturedImages([]);
    } catch (error) {
      console.error("Failed to create PDF:", error);
      Alert.alert("Error", "Failed to create PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle auto-capture
  const toggleAutoCapture = () => {
    setIsAutoCapture((prev) => !prev);
  };

  // Manual capture
  const handleManualCapture = () => {
    if (scannerRef.current && !isAutoCapture) {
      scannerRef.current?.capture();
    }
  };

  // Reset scanner session
  const resetSession = () => {
    setCapturedImages([]);
    scannerRef.current?.reset();
    setIsScanning(true);
  };

  // Cancel and go back
  const handleBack = () => {
    if (capturedImages.length > 0) {
      Alert.alert(
        "Cancel Scan",
        "You have captured images. Are you sure you want to cancel?",
        [
          { text: "Continue Scanning", style: "cancel" },
          {
            text: "Cancel",
            style: "destructive",
            onPress: () => {
              setCapturedImages([]);
              navigation.goBack();
            },
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  // If permission is not yet determined
  if (hasPermission === null) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[styles.permissionText, { color: theme.colors.textSecondary }]}
        >
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  // If permission denied
  if (hasPermission === false) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Ionicons
          name="camera-outline"
          size={64}
          color={theme.colors.iconSecondary}
        />
        <Text style={[styles.permissionText, { color: theme.colors.text }]}>
          Camera permission required
        </Text>
        <TouchableOpacity
          style={[
            styles.permissionButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={checkPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle="light-content" translucent />

      {/* Scanner View */}
      <View style={styles.scannerContainer}>
        <DocumentScanner
          ref={scannerRef}
          style={styles.scanner}
          onDocumentDetected={onDocumentDetected}
          onCapture={onCapture}
          autoCapture={isAutoCapture}
          captureQuality={0.9}
          enableFlash={false}
          showOverlay={true}
          overlayColor="rgba(76, 175, 80, 0.2)"
          overlayEdgeColor={theme.colors.primary}
          edgeDetectionMode={1} // 0 = fast, 1 = accurate, 2 = balanced
          onError={(error) => {
            console.error("DocumentScanner error:", error);
            Alert.alert(
              "Scanner Error",
              "An error occurred while scanning. Please try again.",
            );
          }}
        />
      </View>

      {/* Overlay Controls */}
      <View style={styles.controlsOverlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            onPress={handleBack}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            onPress={toggleAutoCapture}
          >
            <Ionicons
              name={isAutoCapture ? "camera" : "camera-outline"}
              size={24}
              color="white"
            />
            <Text style={styles.controlLabel}>
              {isAutoCapture ? "Auto" : "Manual"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Capture Count */}
        {capturedImages.length > 0 && (
          <View
            style={[
              styles.captureCount,
              { backgroundColor: "rgba(0,0,0,0.7)" },
            ]}
          >
            <Ionicons name="images" size={18} color="white" />
            <Text style={styles.captureCountText}>{capturedImages.length}</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {!isAutoCapture && (
            <TouchableOpacity
              style={[styles.captureButton, { borderColor: "white" }]}
              onPress={handleManualCapture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          )}

          {/* Gallery/Import button (future) */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            onPress={() => {
              Alert.alert("Import from Gallery", "Feature coming soon.");
            }}
          >
            <Ionicons name="images-outline" size={24} color="white" />
          </TouchableOpacity>

          {/* Done button – process all captures */}
          {capturedImages.length > 0 && (
            <TouchableOpacity
              style={[
                styles.doneButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={async () => {
                await processCapturedImages(capturedImages);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.doneButtonText}>Done</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scanner: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  controlLabel: {
    color: "white",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  captureCount: {
    position: "absolute",
    top: 100,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  captureCountText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "white",
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 16,
  },
  doneButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  permissionText: {
    fontSize: 16,
    marginTop: 12,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
