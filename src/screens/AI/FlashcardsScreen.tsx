import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { AIStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { GenerateFlashcardsUseCase } from "../../business/useCases/GenerateFlashcardsUseCase";
import { fileRepository } from "../../repository/FileRepository";

type FlashcardsScreenRouteProp = RouteProp<AIStackParamList, "AIFlashcards">;

const { width } = Dimensions.get("window");

export const FlashcardsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<FlashcardsScreenRouteProp>();
  const { fileId } = route.params;

  const [flashcards, setFlashcards] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileName, setFileName] = useState<string>("");

  // Load file name
  useEffect(() => {
    const loadFileName = async () => {
      try {
        const file = await fileRepository.getFileById(fileId);
        if (file) setFileName(file.name);
      } catch (error) {
        console.warn("Failed to load file name:", error);
      }
    };
    loadFileName();
  }, [fileId]);

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const useCase = new GenerateFlashcardsUseCase();
      const cards = await useCase.execute(fileId);
      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to generate flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [fileId]);

  const flipCard = () => setIsFlipped(!isFlipped);

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const regenerate = () => {
    loadFlashcards();
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Generating flashcards...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (flashcards.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Ionicons
            name="card-outline"
            size={64}
            color={theme.colors.iconSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No flashcards generated
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}
          >
            The AI couldn't generate flashcards from this document.
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={regenerate}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const card = flashcards[currentIndex];

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
        <Text
          style={[styles.headerTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {fileName || "Flashcards"}
        </Text>
        <TouchableOpacity onPress={regenerate} style={styles.headerButton}>
          <Ionicons
            name="refresh-outline"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text
          style={[styles.progressText, { color: theme.colors.textSecondary }]}
        >
          {currentIndex + 1} / {flashcards.length}
        </Text>
        <View
          style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={flipCard}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {isFlipped ? (
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Answer
              </Text>
              <ScrollView
                style={styles.cardScroll}
                contentContainerStyle={styles.cardScrollContent}
              >
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {card.answer}
                </Text>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Question
              </Text>
              <ScrollView
                style={styles.cardScroll}
                contentContainerStyle={styles.cardScrollContent}
              >
                <Text style={[styles.cardText, { color: theme.colors.text }]}>
                  {card.question}
                </Text>
              </ScrollView>
            </View>
          )}
          <View style={styles.flipHint}>
            <Ionicons
              name="sync-outline"
              size={16}
              color={theme.colors.iconSecondary}
            />
            <Text
              style={[
                styles.flipHintText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Tap to {isFlipped ? "show question" : "show answer"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation buttons */}
      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={prevCard}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={
              currentIndex === 0
                ? theme.colors.iconSecondary
                : theme.colors.text
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={nextCard}
          disabled={currentIndex === flashcards.length - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={
              currentIndex === flashcards.length - 1
                ? theme.colors.iconSecondary
                : theme.colors.text
            }
          />
        </TouchableOpacity>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: width - 40,
    height: 380,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardScroll: {
    flex: 1,
    width: "100%",
  },
  cardScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 20,
    textAlign: "center",
    lineHeight: 28,
    paddingVertical: 8,
  },
  flipHint: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
  },
  flipHintText: {
    fontSize: 12,
    marginLeft: 4,
  },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
