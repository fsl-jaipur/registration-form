import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApiClient, extractApiErrorMessage } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";
import { useAuth } from "../context/auth";
import FormToast from "../components/FormToast";

type Test = {
  _id: string;
  title: string;
  numQuestions: number;
  duration: number;
  released?: boolean;
};

const parseJsonObject = <T,>(value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
};

const ATTEMPTED_TESTS_STORAGE_KEY = "fsl_attempted_test_ids";

const readStoredAttemptedTestIds = async (): Promise<string[]> => {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return [];
      }
      const raw = window.localStorage.getItem(ATTEMPTED_TESTS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    }

    const raw = await AsyncStorage.getItem(ATTEMPTED_TESTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const persistAttemptedTestIds = async (ids: Set<string>) => {
  try {
    const serialized = JSON.stringify(Array.from(ids));

    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return;
      }
      window.localStorage.setItem(ATTEMPTED_TESTS_STORAGE_KEY, serialized);
      return;
    }

    await AsyncStorage.setItem(ATTEMPTED_TESTS_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage write failures.
  }
};

export default function StudentPanelScreen() {
  const [tests, setTests] = useState<Test[]>([]);
  const [attemptedTestIds, setAttemptedTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const api = createApiClient(getApiBaseUrl());
  const { logout } = useAuth();

  const mergeAttemptedTestIds = (ids: string[]) => {
    setAttemptedTestIds((current) => {
      const next = new Set([...current, ...ids]);
      void persistAttemptedTestIds(next);
      return next;
    });
  };

  useEffect(() => {
    void readStoredAttemptedTestIds().then((ids) => {
      if (ids.length > 0) {
        setAttemptedTestIds(new Set(ids));
      }
    });

    const loadAttemptedTestIds = async () => {
      try {
        const attemptedResponse = await api.requestJson<{ attemptedTestIds?: string[] }>("/api/students/attempted-test-ids");
        mergeAttemptedTestIds(attemptedResponse.attemptedTestIds ?? []);
      } catch (attemptError) {
        console.error("Failed to fetch attempted test IDs", attemptError);
      }
    };

    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        
        const testsResponse = await api.requestJson<{ tests?: Test[] }>("/api/test/allTests");
        
        const releasedTests = (testsResponse.tests ?? []).filter((test) => test.released);
        setTests(releasedTests);
        await loadAttemptedTestIds();
      } catch (fetchError) {
        console.error("Failed to fetch tests", fetchError);
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void api
        .requestJson<{ attemptedTestIds?: string[] }>("/api/students/attempted-test-ids")
        .then((response) => {
          mergeAttemptedTestIds(response.attemptedTestIds ?? []);
        })
        .catch((attemptError) => {
          console.error("Failed to refresh attempted test IDs", attemptError);
        });

      return undefined;
    }, [])
  );

  const handleStartTest = async (testId: string) => {
    try {
      setStartingTestId(testId);
      setError("");
      const response = await api.request(`/api/students/start-quiz/${testId}`, {
        method: "POST",
      });

      const raw = await response.text();
      const data = raw ? parseJsonObject<{ message?: string; quizAttemptId?: string }>(raw) : {};

      if (!response.ok) {
        if (response.status === 400 && data.message === "You have already attempted this quiz.") {
          mergeAttemptedTestIds([testId]);
          setError("");
          return;
        }
        throw new Error(extractApiErrorMessage(raw) || "Failed to start quiz");
      }

      mergeAttemptedTestIds([testId]);

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
          <Pressable style={styles.quickLinkButton} onPress={() => router.push("/student/assignments")}>
            <Text style={styles.quickLinkText}>Assignments</Text>
          </Pressable>
          <Pressable style={styles.quickLinkButton} onPress={() => router.push("/student/daily-updates")}>
            <Text style={styles.quickLinkText}>Daily Updates</Text>
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

        <View style={styles.headerRow}>
          <Text style={styles.title}>Available Tests</Text>
          <Pressable style={styles.resultButton} onPress={() => router.push("/student/result")}>
            <Text style={styles.resultButtonText}>Result</Text>
          </Pressable>
        </View>

        {error && !loading ? <FormToast message={error} /> : null}
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
        renderItem={({ item }) => {
          const isAttempted = attemptedTestIds.has(item._id);
          const isStarting = startingTestId === item._id;
          const isDisabled = isAttempted || isStarting;

          return (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.numQuestions} questions • {item.duration} mins
                </Text>
                {isAttempted && (
                  <Text style={styles.attemptedBadge}>Already Attempted</Text>
                )}
              </View>
              <Pressable
                style={[
                  styles.startButton,
                  isDisabled && styles.startButtonDisabled,
                  isAttempted && styles.startButtonAttempted,
                ]}
                onPress={() => void handleStartTest(item._id)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.startButtonText,
                  isAttempted && styles.startButtonTextAttempted,
                ]}>
                  {isStarting ? "Starting..." : isAttempted ? "Attempted" : "Start"}
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
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 6,
    marginBottom: 10,
  },
  topLink: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  topLinkText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f172a",
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },
  logoutText: {
    fontSize: 11,
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
  quickLinkButton: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  quickLinkText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
      },
      default: {
        shadowColor: "#0f172a",
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
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
  attemptedBadge: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
    marginTop: 4,
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
  startButtonAttempted: {
    backgroundColor: "#d1d5db",
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
  },
  startButtonTextAttempted: {
    color: "#6b7280",
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
