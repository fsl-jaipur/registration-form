import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

type ResultResponse = {
  questionText?: string;
  questionImage?: string | null;
  options?: string[];
  correctAnswer: string;
  selectedOption?: string;
  selectedAnswer?: string;
  isCorrect: boolean;
};

type ResultDetail = {
  studentName: string;
  studentId: string;
  testTitle: string;
  testDuration: number;
  score: number;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  responses: ResultResponse[];
};

export default function StudentResultDetailScreen() {
  const { quizAttemptId } = useLocalSearchParams<{ quizAttemptId: string }>();
  const [resultDetail, setResultDetail] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const api = useMemo(() => createApiClient(getApiBaseUrl()), []);

  useEffect(() => {
    async function fetchResultDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await api.request(`/api/students/quiz-attempt-detail/${quizAttemptId}`);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Results not yet released for this test.");
          }

          if (response.status === 404) {
            throw new Error("Quiz attempt not found.");
          }

          throw new Error("Failed to load result details. Please try again.");
        }

        const data = (await response.json()) as ResultDetail;
        setResultDetail(data);
      } catch (fetchError) {
        console.error("Failed to fetch result details", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load result details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    if (quizAttemptId) {
      void fetchResultDetail();
    } else {
      setError("Quiz attempt not found.");
      setLoading(false);
    }
  }, [api, quizAttemptId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB");

  const getScorePercentage = (score: number, total: number) =>
    total ? Math.round((score / total) * 100) : 0;

  const scoreTone = useMemo(() => {
    if (!resultDetail) {
      return { badge: "#e2e8f0", text: "#0f172a", summary: "" };
    }
    const percentage = getScorePercentage(resultDetail.score, resultDetail.totalQuestions);
    if (percentage >= 80) {
      return { badge: "#dcfce7", text: "#166534", summary: "Excellent!" };
    }
    if (percentage >= 60) {
      return { badge: "#fef3c7", text: "#92400e", summary: "Good effort!" };
    }
    return { badge: "#fee2e2", text: "#b91c1c", summary: "Keep practicing!" };
  }, [resultDetail]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading result details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace("/student-result")}>
            <Text style={styles.backButtonText}>Back to Results</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!resultDetail) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>No result details found.</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace("/student-result")}>
            <Text style={styles.backButtonText}>Back to Results</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const scorePercentage = getScorePercentage(
    resultDetail.score,
    resultDetail.totalQuestions
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Detailed Score Report</Text>
            <Text style={styles.title}>Quiz Result Details</Text>
          </View>
          <Pressable style={styles.backButton} onPress={() => router.replace("/student-result")}>
            <Text style={styles.backButtonText}>Back to Results</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.testTitle}>{resultDetail.testTitle}</Text>
              <Text style={styles.meta}>Student: {resultDetail.studentName}</Text>
              <Text style={styles.meta}>Attempted: {formatDate(resultDetail.startTime)}</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: scoreTone.badge }]}>
              <Text style={[styles.scoreBadgeText, { color: scoreTone.text }]}>
                {resultDetail.score}/{resultDetail.totalQuestions} ({scorePercentage}%)
              </Text>
            </View>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.sectionLabel}>Performance</Text>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Test Duration</Text>
              <Text style={styles.performanceValue}>{resultDetail.testDuration} minutes</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Questions</Text>
              <Text style={styles.performanceValue}>{resultDetail.totalQuestions}</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Final Score</Text>
              <Text style={[styles.performanceValue, { color: scoreTone.text }]}>
                {resultDetail.score}/{resultDetail.totalQuestions}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Question-wise Analysis</Text>
          <Text style={styles.sectionSubtitle}>
            Review each question, your answer, and the correct answer.
          </Text>
        </View>

        {resultDetail.responses.map((response, index) => {
          const selectedAnswer = response.selectedAnswer || "Not answered";
          return (
            <View key={`${resultDetail.studentId}-${index}`} style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseTitle}>Question {index + 1}</Text>
                <View
                  style={[
                    styles.responseBadge,
                    { backgroundColor: response.isCorrect ? "#dcfce7" : "#fee2e2" },
                  ]}
                >
                  <Text
                    style={[
                      styles.responseBadgeText,
                      { color: response.isCorrect ? "#166534" : "#b91c1c" },
                    ]}
                  >
                    {response.isCorrect ? "Correct" : "Incorrect"}
                  </Text>
                </View>
              </View>

              <View style={styles.responseBody}>
                {response.questionText ? (
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Question</Text>
                    <Text style={styles.blockText}>{response.questionText}</Text>
                  </View>
                ) : null}

                {response.questionImage ? (
                  <Image source={{ uri: response.questionImage }} style={styles.questionImage} />
                ) : null}

                {response.options?.length ? (
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Options</Text>
                    <View style={styles.optionsList}>
                      {response.options.map((option, optionIndex) => {
                        const isCorrect = option === response.correctAnswer;
                        const isSelected = option === response.selectedAnswer;
                        return (
                          <View
                            key={`${index}-${optionIndex}`}
                            style={[
                              styles.optionCard,
                              isCorrect
                                ? styles.optionCorrect
                                : isSelected
                                  ? styles.optionSelected
                                  : styles.optionNeutral,
                            ]}
                          >
                            <View style={styles.optionRow}>
                              <View style={styles.optionBadge}>
                                <Text style={styles.optionBadgeText}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </Text>
                              </View>
                              <View style={styles.optionContent}>
                                <Text style={styles.optionText}>{option}</Text>
                                <View style={styles.optionTags}>
                                  {isCorrect ? <Text style={styles.correctTag}>Correct</Text> : null}
                                  {isSelected && !isCorrect ? (
                                    <Text style={styles.selectedTag}>Your Answer</Text>
                                  ) : null}
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={styles.answerGrid}>
                  <View style={styles.answerCard}>
                    <Text style={styles.blockLabel}>Your Answer</Text>
                    <Text style={styles.blockText}>{selectedAnswer}</Text>
                  </View>
                  <View style={styles.answerCard}>
                    <Text style={styles.blockLabel}>Correct Answer</Text>
                    <Text style={styles.blockText}>{response.correctAnswer}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.finalScore}>
          <Text style={styles.finalLabel}>Final Score</Text>
          <Text style={[styles.finalScoreText, { color: scoreTone.text }]}>
            {resultDetail.score}/{resultDetail.totalQuestions} ({scorePercentage}%)
          </Text>
          <Text style={styles.finalSummary}>{scoreTone.summary}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    backgroundColor: "#ffffff",
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  meta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  scoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  performanceCard: {
    marginTop: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  performanceLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  performanceValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  responseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  responseBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  responseBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  responseBody: {
    gap: 12,
  },
  block: {
    gap: 6,
  },
  blockLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  blockText: {
    fontSize: 13,
    color: "#0f172a",
  },
  questionImage: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  optionsList: {
    gap: 8,
  },
  optionCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  optionNeutral: {
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  optionSelected: {
    borderColor: "#fecaca",
    backgroundColor: "#fee2e2",
  },
  optionCorrect: {
    borderColor: "#bbf7d0",
    backgroundColor: "#dcfce7",
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionBadge: {
    height: 26,
    width: 26,
    borderRadius: 13,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  optionBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "600",
  },
  optionTags: {
    marginTop: 4,
    flexDirection: "row",
    gap: 8,
  },
  correctTag: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "600",
  },
  selectedTag: {
    fontSize: 11,
    color: "#b91c1c",
    fontWeight: "600",
  },
  answerGrid: {
    gap: 10,
  },
  answerCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  finalScore: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  finalLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  finalScoreText: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },
  finalSummary: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 12,
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
  },
});
