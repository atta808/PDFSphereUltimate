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
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { AIStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { GenerateQuizUseCase } from "../../business/useCases/GenerateQuizUseCase";
import { fileRepository } from "../../repository/FileRepository";

type QuizScreenRouteProp = RouteProp<AIStackParamList, "AIQuiz">;

export const QuizScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<QuizScreenRouteProp>();
  const { fileId } = route.params;

  const [questions, setQuestions] = useState<
    Array<{ question: string; options: string[]; correct: number }>
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<boolean[]>([]);
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

  const loadQuiz = async () => {
    setIsLoading(true);
    try {
      const useCase = new GenerateQuizUseCase();
      const quiz = await useCase.execute(fileId);
      setQuestions(quiz);
      setCurrentIndex(0);
      setSelectedOption(null);
      setShowResult(false);
      setScore(0);
      setAnswers([]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to generate quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [fileId]);

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(index);
    const isCorrect = index === questions[currentIndex].correct;
    setScore((prev) => prev + (isCorrect ? 1 : 0));
    setAnswers((prev) => [...prev, isCorrect]);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  const regenerate = () => {
    loadQuiz();
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
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
            Generating quiz...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Ionicons
            name="help-circle-outline"
            size={64}
            color={theme.colors.iconSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No quiz generated
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}
          >
            The AI couldn't generate quiz questions from this document.
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

  // Results screen
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const emoji = percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : "📚";
    const message =
      percentage >= 80
        ? "Excellent work!"
        : percentage >= 60
          ? "Good effort!"
          : "Keep learning!";

    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Quiz Results
          </Text>
          <TouchableOpacity onPress={regenerate} style={styles.headerButton}>
            <Ionicons
              name="refresh-outline"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={styles.resultContent}
        >
          <View
            style={[
              styles.scoreCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.emoji, { color: theme.colors.text }]}>
              {emoji}
            </Text>
            <Text style={[styles.scoreNumber, { color: theme.colors.text }]}>
              {score}
            </Text>
            <Text
              style={[styles.scoreTotal, { color: theme.colors.textSecondary }]}
            >
              / {questions.length}
            </Text>
            <Text
              style={[styles.percentageText, { color: theme.colors.primary }]}
            >
              {percentage}%
            </Text>
            <Text
              style={[
                styles.resultMessage,
                { color: theme.colors.textSecondary },
              ]}
            >
              {message}
            </Text>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={restartQuiz}
            >
              <Text style={styles.actionButtonText}>Retake Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={regenerate}
            >
              <Text
                style={[styles.actionButtonText, { color: theme.colors.text }]}
              >
                New Quiz
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
            Review Answers
          </Text>
          {questions.map((q, idx) => (
            <View
              key={idx}
              style={[styles.reviewItem, { borderColor: theme.colors.border }]}
            >
              <View style={styles.reviewHeader}>
                <Text
                  style={[
                    styles.reviewIndex,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Q{idx + 1}.
                </Text>
                <Text
                  style={[
                    styles.reviewStatus,
                    {
                      color: answers[idx]
                        ? theme.colors.success
                        : theme.colors.error,
                    },
                  ]}
                >
                  {answers[idx] ? "✅ Correct" : "❌ Incorrect"}
                </Text>
              </View>
              <Text
                style={[styles.reviewQuestion, { color: theme.colors.text }]}
              >
                {q.question}
              </Text>
              <Text
                style={[
                  styles.reviewAnswer,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Correct answer: {q.options[q.correct]}
              </Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Question screen
  const question = questions[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];

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
          {fileName ? fileName.substring(0, 20) : "Quiz"}
        </Text>
        <TouchableOpacity onPress={regenerate} style={styles.headerButton}>
          <Ionicons
            name="refresh-outline"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text
          style={[styles.progressText, { color: theme.colors.textSecondary }]}
        >
          {currentIndex + 1} of {questions.length}
        </Text>
        <View
          style={[styles.progressBar, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Question */}
      <ScrollView
        style={styles.questionContainer}
        contentContainerStyle={styles.questionContent}
      >
        <Text style={[styles.questionText, { color: theme.colors.text }]}>
          {question.question}
        </Text>

        {/* Options */}
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === question.correct;
          let backgroundColor = theme.colors.surface;
          let borderColor = theme.colors.border;
          let textColor = theme.colors.text;

          if (selectedOption !== null) {
            if (isSelected) {
              if (isCorrect) {
                backgroundColor = theme.colors.successLight;
                borderColor = theme.colors.success;
                textColor = theme.colors.success;
              } else {
                backgroundColor = theme.colors.errorLight;
                borderColor = theme.colors.error;
                textColor = theme.colors.error;
              }
            } else if (isCorrect) {
              backgroundColor = theme.colors.successLight;
              borderColor = theme.colors.success;
              textColor = theme.colors.success;
            }
          }

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionButton,
                {
                  backgroundColor,
                  borderColor,
                  borderWidth: selectedOption !== null ? 2 : 1,
                },
              ]}
              onPress={() => handleOptionSelect(idx)}
              disabled={selectedOption !== null}
            >
              <Text style={[styles.optionLabel, { color: textColor }]}>
                {optionLabels[idx]}.
              </Text>
              <Text style={[styles.optionText, { color: textColor }]}>
                {option}
              </Text>
              {selectedOption !== null && isSelected && (
                <Ionicons
                  name={isCorrect ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={isCorrect ? theme.colors.success : theme.colors.error}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Next button */}
      {selectedOption !== null && (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={nextQuestion}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === questions.length - 1
              ? "See Results"
              : "Next Question"}
          </Text>
        </TouchableOpacity>
      )}
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
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 20,
    lineHeight: 28,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  nextButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  // Results
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "700",
  },
  scoreTotal: {
    fontSize: 20,
    fontWeight: "500",
  },
  percentageText: {
    fontSize: 28,
    fontWeight: "600",
    marginTop: 4,
  },
  resultMessage: {
    fontSize: 16,
    marginTop: 4,
  },
  resultActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 16,
    color: "white",
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  reviewItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reviewIndex: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewQuestion: {
    fontSize: 14,
    marginBottom: 2,
  },
  reviewAnswer: {
    fontSize: 13,
  },
});
