import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

type QuizAttempt = {
  _id: string;
  quizAttemptId?: string;
  testId: string;
  testTitle?: string;
  testDuration?: number;
  startTime?: string;
  endTime?: string;
  score?: number;
  responses?: unknown[];
};

type TestMap = Record<
  string,
  {
    _id: string;
    title?: string;
    duration?: number;
    result?: boolean;
  }
>;

export default function StudentResultScreen() {
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tests, setTests] = useState<TestMap>({});
  const api = createApiClient(getApiBaseUrl());

  useEffect(() => {
    async function fetchQuizAttempts() {
      try {
        setLoading(true);
        setError("");
        const data = await api.requestJson<QuizAttempt[]>("/api/students/quiz-attempts");

        if (Array.isArray(data)) {
          const formattedAttempts = data.map((attempt) => ({
            ...attempt,
            quizAttemptId: attempt._id,
            testTitle: attempt.testTitle,
            testDuration: attempt.testDuration,
          }));

          setQuizAttempts(formattedAttempts);

          const testsMap: TestMap = {};
          formattedAttempts.forEach((attempt) => {
            testsMap[attempt.testId] = {
              _id: attempt.testId,
              title: attempt.testTitle,
              duration: attempt.testDuration,
              result: true,
            };
          });
          setTests(testsMap);
        }
      } catch (err) {
        console.error("Failed to fetch quiz attempts", err);
        setError("Failed to load quiz results. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuizAttempts();
  }, []);

  const handleViewResult = (quizAttemptId: string, testId: string) => {
    router.push({
      pathname: "/student-result-detail/[quizAttemptId]",
      params: { quizAttemptId, testId },
    });
  };

  const getScoreDisplay = (attempt: QuizAttempt) => {
    if (attempt.score !== undefined && attempt.score !== null) {
      return `${attempt.score}/${attempt.responses?.length || 0}`;
    }
    return "Not completed";
  };

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Quiz Results</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace("/student-panel")}>
            <Text style={styles.backButtonText}>Back to Tests</Text>
          </Pressable>
        </View>

        {quizAttempts.length === 0 && !loading ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>No Released Results</Text>
            <Text style={styles.infoText}>
              No quiz results have been released yet. Results will appear here once released.
            </Text>
          </View>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              Results Available! You have {quizAttempts.length} quiz attempt(s).
            </Text>
          </View>
        )}
      </View>
    ),
    [loading, quizAttempts.length]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading your quiz results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace("/student-panel")}>
            <Text style={styles.backButtonText}>Back to Tests</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={quizAttempts}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={null}
        renderItem={({ item }) => {
          const test = tests[item.testId];
          const status = item.endTime ? "Completed" : "In Progress";
          const startDate = item.startTime
            ? new Date(item.startTime).toLocaleDateString("en-GB")
            : "-";

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{test?.title || "Untitled Test"}</Text>
                <Text style={styles.badge}>{status}</Text>
              </View>
              <Text style={styles.cardMeta}>
                Duration: {test?.duration ? `${test.duration} min` : "—"}
              </Text>
              <Text style={styles.cardMeta}>Started: {startDate}</Text>
              <Text style={styles.cardScore}>Score: {getScoreDisplay(item)}</Text>
              <Pressable
                style={[styles.viewButton, !item.endTime && styles.viewButtonDisabled]}
                disabled={!item.endTime}
                onPress={() =>
                  handleViewResult(item.quizAttemptId ?? item._id, item.testId)
                }
              >
                <Text style={styles.viewButtonText}>
                  {item.endTime ? "View Details" : "In Progress"}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
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
  infoBox: {
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#1e3a8a",
  },
  successBox: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  successText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  cardScore: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  viewButton: {
    marginTop: 12,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  viewButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  viewButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
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
