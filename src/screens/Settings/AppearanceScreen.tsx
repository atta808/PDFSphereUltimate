import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme, ThemeMode } from "../../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageKeys } from "../../constants/storage";

type ThemeOption = {
  label: string;
  value: ThemeMode;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

export const AppearanceScreen: React.FC = () => {
  const { theme, mode, setTheme } = useTheme();
  const navigation = useNavigation();

  const options: ThemeOption[] = [
    {
      label: "Light",
      value: "light",
      icon: "sunny-outline",
      description: "Use light theme always",
    },
    {
      label: "Dark",
      value: "dark",
      icon: "moon-outline",
      description: "Use dark theme always",
    },
    {
      label: "System",
      value: "system",
      icon: "phone-portrait-outline",
      description: "Follow your device system theme",
    },
  ];

  const handleSelect = async (selectedMode: ThemeMode) => {
    try {
      await setTheme(selectedMode);
    } catch (error) {
      console.error("Failed to set theme:", error);
      Alert.alert("Error", "Failed to change theme. Please try again.");
    }
  };

  // Get current mode display name
  const getModeLabel = (modeValue: ThemeMode) => {
    return options.find((o) => o.value === modeValue)?.label || "System";
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
          Appearance
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {/* Current mode indicator */}
        <View
          style={[
            styles.currentModeCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.currentModeLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Current Mode
          </Text>
          <Text style={[styles.currentModeValue, { color: theme.colors.text }]}>
            {getModeLabel(mode)}
          </Text>
          <View
            style={[
              styles.currentModePreview,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={[
                styles.previewRow,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View
                style={[
                  styles.previewDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: theme.colors.text },
                ]}
              />
              <View
                style={[
                  styles.previewLineShort,
                  { backgroundColor: theme.colors.textSecondary },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Theme options */}
        {options.map((option) => {
          const isSelected = mode === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primarySurface
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={isSelected ? "white" : theme.colors.text}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: isSelected
                          ? theme.colors.primary
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </View>
              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
          System mode follows your device's system theme setting. Changes take
          effect immediately.
        </Text>
      </View>
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
    padding: 16,
    flex: 1,
  },
  currentModeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
  },
  currentModeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  currentModeValue: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  currentModePreview: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    width: "80%",
  },
  previewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  previewLine: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  previewLineShort: {
    width: 30,
    height: 8,
    borderRadius: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
