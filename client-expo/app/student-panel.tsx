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
import { useAuth } from "../context/auth";

type Test = {
  _id: string;
  title: string;
  numQuestions: number;
  duration: number;
  released?: boolean;
};

export default function StudentPanelScreen() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const api = createApiClient(getApiBaseUrl());
  const { logout } = useAuth();

  useEffect(() => {
    async function fetchTests() {
      try {
        setLoading(true);
        setError("");
        const data = await api.requestJson<{ tests?: Test[] }>("/api/test/allTests");
        const releasedTests = (data.tests ?? []).filter((test) => test.released);
        setTests(releasedTests);
      } catch (fetchError) {
        console.error("Failed to fetch tests", fetchError);
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchTests();
  }, []);

  const handleStartTest = async (testId: string) => {
    try {
      setStartingTestId(testId);
      setError("");
      const response = await api.request(`/api/students/start-quiz/${testId}`, {
        method: "POST",
      });

      const data = (await response.json()) as { message?: string; quizAttemptId?: string };

      if (!response.ok) {
        if (response.status === 400 && data.message === "You have already attempted this quiz.") {
          setError("You have already attempted this quiz.");
          return;
        }
        throw new Error(data.message || "Failed to start quiz");
      }

      router.push({
        pathname: "/student-quiz/[testId]",
        params: { testId, quizAttemptId: data.quizAttemptId ?? "" },
      });
    } catch (startError) {
      console.error("Failed to start test", startError);
      setError("Failed to start quiz. Please try again.");
    } finally {
      setStartingTestId(null);
    }
  };

  const header = useMemo(
    () => (
      <View>
        <View style={styles.topActions}>
          <Pressable style={styles.topLink} onPress={() => router.replace("/student-panel")}>
            <Text style={styles.topLinkText}>Home</Text>
          </Pressable>
          <Pressable
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Quiz Security Notice</Text>
          <Text style={styles.noticeText}>
            Important: This quiz is monitored for integrity. Switching apps, opening new windows, or
            attempting to copy content may automatically submit your quiz with the current score.
          </Text>
        </View>

        <View style={styles.quickLinks}>
          <Pressable style={styles.quickLinkButton} onPress={() => router.push("/student/assignments")}>
            <Text style={styles.quickLinkText}>Assignments</Text>
          </Pressable>
          <Pressable style={styles.quickLinkButton} onPress={() => router.push("/student/daily-updates")}>
            <Text style={styles.quickLinkText}>Daily Updates</Text>
          </Pressable>
          <Pressable style={styles.quickLinkButton} onPress={() => router.push("/student/result")}>
            <Text style={styles.quickLinkText}>Result</Text>
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Available Tests</Text>
          <Pressable style={styles.resultButton} onPress={() => router.push("/student/result")}>
            <Text style={styles.resultButtonText}>Result</Text>
          </Pressable>
        </View>

        {error && !loading ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [error, loading]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={tests}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tests available.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {item.numQuestions} questions • {item.duration} mins
              </Text>
            </View>
            <Pressable
              style={[styles.startButton, startingTestId === item._id && styles.startButtonDisabled]}
              onPress={() => void handleStartTest(item._id)}
              disabled={startingTestId === item._id}
            >
              <Text style={styles.startButtonText}>
                {startingTestId === item._id ? "Starting..." : "Start"}
              </Text>
            </Pressable>
          </View>
        )}
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
  notice: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 16,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 10,
  },
  topLink: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  topLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  resultButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  resultButtonText: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 12,
  },
  quickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  quickLinkButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  quickLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  startButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 12,
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
});
