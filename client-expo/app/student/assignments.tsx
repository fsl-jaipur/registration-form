import { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
} from "react-native";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

let WebView: any = null;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch {
    WebView = null;
  }
}

type Assignment = {
  _id: string;
  title: string;
  videoLink: string;
  thumbnail?: string | null;
  category?: string;
  createdAt?: string;
};

const getYouTubeEmbedUrl = (videoLink: string) => {
  try {
    const url = new URL(videoLink);
    const host = url.hostname.replace(/^www\./, "");
    const playlistId = url.searchParams.get("list");
    
    // Additional params for mobile playback
    const mobileParams = "rel=0&playsinline=1&enablejsapi=1&modestbranding=1";

    if (host === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}?${mobileParams}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?${mobileParams}`;
        }
        if (playlistId) {
          return `https://www.youtube.com/embed/videoseries?list=${playlistId}&${mobileParams}`;
        }
      }
      if (url.pathname.startsWith("/embed/")) {
        const videoId = url.pathname.split("/embed/")[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}?${mobileParams}` : null;
      }
      if (url.pathname === "/playlist" && playlistId) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistId}&${mobileParams}`;
      }
    }
  } catch {
    return null;
  }
  return null;
};

export default function StudentAssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const api = createApiClient(getApiBaseUrl());

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true);
        setError("");
        const data = await api.requestJson<{ assignments?: Assignment[] }>("/api/assignments");
        setAssignments(Array.isArray(data?.assignments) ? data.assignments : []);

        const cats = Array.from(
          new Set(
            (data?.assignments || [])
              .map((a) => a.category)
              .filter(Boolean)
          )
        ) as string[];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch assignments", err);
        setError(err instanceof Error ? err.message : "Failed to load assignments.");
      } finally {
        setLoading(false);
      }
    }

    void fetchAssignments();
  }, []);

  const visibleAssignments = useMemo(() => {
    if (selectedCategory === "All") return assignments;
    return assignments.filter((a) => a.category === selectedCategory);
  }, [assignments, selectedCategory]);

  const tabList = ["All", ...categories];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={visibleAssignments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.headerLabel}>STUDENT ASSIGNMENTS</Text>
              <Text style={styles.title}>Assignments & Videos</Text>
              <Text style={styles.subtitle}>
                Watch the assignment videos and complete your work using the latest instructions shared by your
                mentor.
              </Text>
            </View>

            {assignments.length > 0 && (
              <View style={styles.tabs}>
                {tabList.map((tab) => (
                  <Pressable
                    key={tab}
                    style={[
                      styles.tab,
                      selectedCategory === tab && styles.tabActive,
                    ]}
                    onPress={() => setSelectedCategory(tab)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        selectedCategory === tab && styles.tabTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assignments yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const embedUrl = getYouTubeEmbedUrl(item.videoLink);
          const isPlaying = playingId === item._id;

          return (
            <View style={styles.card}>
              <View style={styles.videoContainer}>
                {isPlaying && embedUrl ? (
                  Platform.OS === "web" ? (
                    <iframe
                      src={embedUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: "8px",
                      }}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : WebView ? (
                    <WebView
                      source={{ uri: embedUrl }}
                      style={styles.webview}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      allowsFullscreenVideo={true}
                      mixedContentMode="compatibility"
                      originWhitelist={["*"]}
                      showsVerticalScrollIndicator={false}
                      showsHorizontalScrollIndicator={false}
                      onError={(syntheticEvent: any) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn("WebView error:", nativeEvent);
                      }}
                    />
                  ) : (
                    <View style={styles.fallback}>
                      <Text style={styles.fallbackText}>Video player not available</Text>
                    </View>
                  )
                ) : (
                  <>
                    {item.thumbnail ? (
                      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailPlaceholder} />
                    )}
                    <Pressable
                      style={styles.playButton}
                      onPress={() => setPlayingId(item._id)}
                    >
                      <View style={styles.playIcon}>
                        <Text style={styles.playSymbol}>▶</Text>
                      </View>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                {isPlaying && embedUrl && (
                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setPlayingId(null)}
                  >
                    <Text style={styles.closeText}>Close Video</Text>
                  </Pressable>
                )}

                <View style={styles.cardMeta}>
                  {item.category && (
                    <Text style={styles.category}>{item.category}</Text>
                  )}
                  {item.createdAt && (
                    <Text style={styles.date}>
                      ADDED ON {new Date(item.createdAt)
                        .toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  header: {
    padding: 20,
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
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#fff",
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  tabActive: {
    borderColor: "#0e6ba8",
    backgroundColor: "#0e6ba8",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#fff",
  },
  error: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 8,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#cbd5e1",
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1f2937",
  },
  fallbackText: {
    color: "#fff",
    fontSize: 14,
  },
  playButton: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  playSymbol: {
    fontSize: 24,
    color: "#0f172a",
    marginLeft: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    marginBottom: 10,
  },
  closeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#b91c1c",
  },
  cardMeta: {
    flexDirection: "column",
    gap: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f97316",
  },
  date: {
    fontSize: 11,
    color: "#94a3b8",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});
