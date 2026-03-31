import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";
import FormToast from "../../components/FormToast";

type DailyUpdate = {
  _id: string;
  message: string;
  trelloCardUrl?: string | null;
  createdAt?: string;
};

export default function StudentDailyUpdatesScreen() {
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const api = createApiClient(getApiBaseUrl());

  async function fetchUpdates() {
    try {
      setLoading(true);
      setError("");
      const data = await api.requestJson<{ updates?: DailyUpdate[] }>("/api/daily-updates/me");
      setUpdates(Array.isArray(data?.updates) ? data.updates : []);
    } catch (err) {
      console.error("Fetch daily updates failed", err);
      setError(err instanceof Error ? err.message : "Failed to load updates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUpdates();
  }, []);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please write a short update before posting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const data = await api.requestJson<{ update?: DailyUpdate }>("/api/daily-updates", {
        method: "POST",
        body: JSON.stringify({ message: trimmed }),
      });

      if (data.update) {
        setUpdates((prev) => [data.update!, ...prev]);
        setMessage("");
      }
    } catch (err) {
      console.error("Post daily update failed", err);
      setError(err instanceof Error ? err.message : "Failed to post update.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={updates}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.headerLabel}>DAILY UPDATES</Text>
              <Text style={styles.title}>Share today's progress</Text>
              <Text style={styles.subtitle}>
                Post what you worked on today. A Trello card is created automatically for each update.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Today's update</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Example: Completed UI for login page, fixed API errors, blocked on deployment."
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />

              <View style={styles.formFooter}>
                <Text style={styles.formHint}>Be concise. One update per day is ideal.</Text>
                <Pressable
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.submitText}>
                    {submitting ? "Posting..." : "Post Update"}
                  </Text>
                </Pressable>
              </View>

              {error ? <FormToast message={error} /> : null}
            </View>

            <View style={styles.updatesHeader}>
              <Text style={styles.updatesTitle}>Your recent updates</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{updates.length} total</Text>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading updates...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No updates yet. Post your first one above.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.updateCard}>
            <Text style={styles.updateMessage}>{item.message}</Text>

            <View style={styles.updateMeta}>
              {item.createdAt && (
                <Text style={styles.updateDate}>
                  {new Date(item.createdAt).toLocaleString("en-GB")}
                </Text>
              )}
              {item.trelloCardUrl && (
                <Text style={styles.trelloLink}>{item.trelloCardUrl}</Text>
              )}
            </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0e6ba8",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0f172a",
    textAlignVertical: "top",
    marginBottom: 12,
  },
  formFooter: {
    alignItems: "flex-start",
    gap: 10,
  },
  formHint: {
    fontSize: 12,
    color: "#64748b",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  updatesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updatesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  badgeContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  updateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  updateMessage: {
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 20,
    marginBottom: 8,
  },
  updateMeta: {
    flexDirection: "column",
    gap: 4,
  },
  updateDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  trelloLink: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
