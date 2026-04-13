import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

type QuestionText =
  | string
  | {
      text?: string;
      fileUrl?: string;
    };

type QuestionOption =
  | string
  | {
      text?: string;
      fileUrl?: string;
    };

type Question = {
  _id: string;
  question: QuestionText;
  options: QuestionOption[];
  correct_answer: string;
};

type SelectedResponse = {
  selectedAnswer: string;
  selectedOption: string;
};

type ResponseMap = Record<string, SelectedResponse>;

type StartQuizResponse = {
  quizAttemptId: string;
};

type QuestionsResponse = {
  questions: Question[];
  duration: number;
};

export default function StudentQuizScreen() {
  const { testId, quizAttemptId: quizAttemptIdParam } = useLocalSearchParams<{
    testId: string;
    quizAttemptId?: string;
  }>();

  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [error, setError] = useState("");

  const isQuizFinishedRef = useRef(false);
  const quizAttemptIdRef = useRef<string | null>(null);
  const responsesRef = useRef<ResponseMap>({});
  const questionsRef = useRef<Question[]>([]);

  const api = useMemo(() => createApiClient(getApiBaseUrl()), []);

  const requestJson = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => api.requestJson<T>(path, init),
    [api]
  );

  useEffect(() => {
    isQuizFinishedRef.current = isQuizFinished;
  }, [isQuizFinished]);

  useEffect(() => {
    quizAttemptIdRef.current = quizAttemptId;
  }, [quizAttemptId]);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    if (!testId) {
      setError("Missing test id.");
      setLoading(false);
      return;
    }

    async function startQuizAndFetchQuestions() {
      try {
        setLoading(true);
        setError("");

        const existingQuizAttemptId = typeof quizAttemptIdParam === "string" ? quizAttemptIdParam : undefined;

        if (existingQuizAttemptId) {
          setQuizAttemptId(existingQuizAttemptId);
        } else {
          const startData = await requestJson<StartQuizResponse>(`/api/students/start-quiz/${testId}`, {
            method: "POST",
          });
          setQuizAttemptId(startData.quizAttemptId);
        }

        const questionData = await requestJson<QuestionsResponse>(`/api/students/get-questions/${testId}`);
        const shuffledQuestions = [...questionData.questions].sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
        setTimeLeft(questionData.duration * 60);
      } catch (err) {
        console.error("Error starting quiz or fetching questions:", err);
        const message =
          err instanceof Error && err.message.includes("already attempted")
            ? "You have already attempted this quiz."
            : "Failed to load quiz. Please try again.";
        setError(message);
        if (message === "You have already attempted this quiz.") {
          setTimeout(() => router.replace("/student-panel"), 2000);
        }
      } finally {
        setLoading(false);
      }
    }

    startQuizAndFetchQuestions();
  }, [quizAttemptIdParam, requestJson, testId]);

  const calculateScoreFromRefs = useCallback(() => {
    let score = 0;
    questionsRef.current.forEach((question) => {
      const response = responsesRef.current[question._id];
      const isCorrect = response?.selectedAnswer === question.correct_answer;
      if (isCorrect) score += 1;
    });
    return score;
  }, []);

  const showThankYouMessage = useCallback(() => {
    setShowThankYou(true);
    setTimeout(() => router.replace("/student-panel"), 5000);
  }, []);

  const finishQuizSilently = useCallback(
    async (reason = "Auto submission") => {
      if (isQuizFinishedRef.current || !quizAttemptIdRef.current) {
        return;
      }

      try {
        const score = calculateScoreFromRefs();
        await requestJson(`/api/students/finishQuiz/${quizAttemptIdRef.current}`, {
          method: "POST",
          body: JSON.stringify({ score, reason }),
        });
        isQuizFinishedRef.current = true;
        setShowThankYou(true);
        setTimeout(() => router.replace("/student-panel"), 3000);
      } catch (err) {
        console.error("Silent finish error:", err);
      }
    },
    [calculateScoreFromRefs, requestJson]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        finishQuizSilently("App moved to background");
      }
    });

    return () => subscription.remove();
  }, [finishQuizSilently]);

  useEffect(() => {
    if (timeLeft <= 0 || isQuizFinished) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizFinished, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelect = (questionId: string, answerText: string, optionLetter: string) => {
    if (isQuizFinished) return;
    setResponses((prev) => ({
      ...prev,
      [questionId]: { selectedAnswer: answerText, selectedOption: optionLetter },
    }));
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const response = responses[questionId];
    if (!response || submitting || isQuizFinished || !quizAttemptId || !testId) {
      return;
    }

    setSubmitting(true);

    try {
      await requestJson(`/api/students/submit-answer/${quizAttemptId}/${testId}`, {
        method: "POST",
        body: JSON.stringify({
          questionId,
          selectedAnswer: response.selectedAnswer,
          selectedOption: response.selectedOption,
        }),
      });

      setTimeout(() => {
        if (currentQuestionIndex === questions.length - 1) {
          void handleFinishQuiz();
        } else {
          setCurrentQuestionIndex((idx) => idx + 1);
        }
        setSubmitting(false);
      }, 500);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
    }
  };

  const calculateScore = (responseMap: ResponseMap) => {
    let score = 0;
    questions.forEach((question) => {
      const response = responseMap[question._id];
      if (response?.selectedAnswer === question.correct_answer) {
        score += 1;
      }
    });
    return score;
  };

  const handleFinishQuiz = async () => {
    if (isQuizFinished || !quizAttemptId || !testId) return;

    setIsQuizFinished(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const lastResponse = currentQuestion ? responses[currentQuestion._id] : undefined;

      if (currentQuestion && lastResponse) {
        await requestJson(`/api/students/submit-answer/${quizAttemptId}/${testId}`, {
          method: "POST",
          body: JSON.stringify({
            questionId: currentQuestion._id,
            selectedAnswer: lastResponse.selectedAnswer,
            selectedOption: lastResponse.selectedOption,
          }),
        });
      }

      const score = calculateScore(responses);
      await requestJson(`/api/students/finishQuiz/${quizAttemptId}`, {
        method: "POST",
        body: JSON.stringify({ score }),
      });

      showThankYouMessage();
    } catch (err) {
      console.error("Finish error:", err);
      setIsQuizFinished(false);
      setError("Error finishing quiz.");
    }
  };

  const handleTimeUp = async () => {
    if (isQuizFinished || !quizAttemptId) return;

    setIsQuizFinished(true);

    try {
      const score = calculateScore(responses);
      await requestJson(`/api/students/finishQuiz/${quizAttemptId}`, {
        method: "POST",
        body: JSON.stringify({ score, reason: "Time expired" }),
      });
      showThankYouMessage();
    } catch (err) {
      console.error("Time-up submission failed:", err);
      setError("Error submitting after time expired.");
    }
  };

  const getQuestionText = (question: Question) => {
    if (typeof question.question === "object") {
      return question.question.text || "No question text";
    }
    return question.question || "No question text";
  };

  const getQuestionImage = (question: Question) =>
    typeof question.question === "object" ? question.question.fileUrl : undefined;

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? responses[currentQuestion._id]?.selectedAnswer : undefined;
  const progressPercentage = questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showThankYou) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.thankYouBox}>
          <Text style={styles.thankYouTitle}>Thank you for attempting the quiz.</Text>
          <Text style={styles.thankYouText}>
            Your submission has been recorded. Redirecting to your dashboard.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Quiz protection is active.</Text>
          <Text style={styles.noticeText}>
            Switching apps or leaving the quiz will submit automatically.
          </Text>
        </View>

        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerMeta}>
                Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
              </Text>
              <Text style={styles.headerTitle}>Student Quiz</Text>
            </View>
            <View style={[styles.timerChip, timeLeft <= 300 && styles.timerDanger]}>
              <Text style={styles.timerText}>Time Left: {formatTime(timeLeft)}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {currentQuestion ? (
          <FlatList
            data={currentQuestion.options}
            keyExtractor={(_, index) => `${currentQuestion._id}-${index}`}
            contentContainerStyle={styles.questionContent}
            ListHeaderComponent={
              <View>
                <Text style={styles.questionTitle}>
                  Q{currentQuestionIndex + 1}: {getQuestionText(currentQuestion)}
                </Text>
                {getQuestionImage(currentQuestion) ? (
                  <Image
                    source={{ uri: getQuestionImage(currentQuestion) }}
                    style={styles.questionImage}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            }
            renderItem={({ item, index }) => {
              const optionText = typeof item === "object" ? item.text || "No option text" : item;
              const optionFile = typeof item === "object" ? item.fileUrl : undefined;
              const isSelected = selectedAnswer === optionText;
              const letter = String.fromCharCode(65 + index);

              return (
                <Pressable
                  onPress={() => handleSelect(currentQuestion._id, optionText, letter)}
                  disabled={isQuizFinished}
                  style={[styles.optionCard, isSelected && styles.optionSelected]}
                >
                  <View style={styles.optionRow}>
                    <View style={styles.optionBadge}>
                      <Text style={styles.optionBadgeText}>{letter}</Text>
                    </View>
                    <View style={styles.optionTextWrapper}>
                      <Text style={styles.optionText}>{optionText}</Text>
                      {optionFile ? (
                        <Text style={styles.optionLink}>File: {optionFile}</Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              <View style={styles.footerRow}>
                <Text style={styles.footerHint}>Select one option, then submit.</Text>
                {currentQuestionIndex === questions.length - 1 && selectedAnswer ? (
                  <Pressable
                    onPress={() => void handleFinishQuiz()}
                    disabled={isQuizFinished || submitting}
                    style={[styles.finishButton, (isQuizFinished || submitting) && styles.buttonDisabled]}
                  >
                    <Text style={styles.finishButtonText}>{submitting ? "Submitting..." : "Finish Quiz"}</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => void handleSubmitAnswer(currentQuestion._id)}
                    disabled={!selectedAnswer || isQuizFinished || submitting}
                    style={[styles.submitButton, (!selectedAnswer || isQuizFinished || submitting) && styles.buttonDisabled]}
                  >
                    <Text style={styles.submitButtonText}>{submitting ? "Submitting..." : "Submit Answer"}</Text>
                  </Pressable>
                )}
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No questions available.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  notice: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: "#92400e",
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  timerChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timerDanger: {
    backgroundColor: "#fee2e2",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#f59e0b",
  },
  questionContent: {
    gap: 12,
    paddingBottom: 24,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  questionImage: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  optionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionSelected: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
  },
  optionRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionBadge: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  optionBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  optionLink: {
    marginTop: 6,
    fontSize: 12,
    color: "#b45309",
  },
  footerRow: {
    marginTop: 8,
    gap: 12,
    alignItems: "flex-start",
  },
  footerHint: {
    fontSize: 12,
    color: "#64748b",
  },
  submitButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  finishButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  finishButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#94a3b8",
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
  thankYouBox: {
    flex: 1,
    margin: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  thankYouTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
    textAlign: "center",
  },
  thankYouText: {
    fontSize: 12,
    color: "#166534",
    textAlign: "center",
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
  },
});
