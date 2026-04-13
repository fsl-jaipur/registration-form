import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

let YoutubePlayer: any = null;
if (Platform.OS !== "web") {
  try {
    YoutubePlayer = require("react-native-youtube-iframe").default;
  } catch {
    YoutubePlayer = null;
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

type VideoUrls = {
  embedUrl: string;
  watchUrl: string;
  videoId?: string;
  playlistId?: string;
};

const getYouTubeVideoUrls = (videoLink: string): VideoUrls | null => {
  try {
    const url = new URL(videoLink);
    const host = url.hostname.replace(/^www\./, "");
    const playlistId = url.searchParams.get("list") || undefined;
    const mobileParams = "rel=0&playsinline=1&enablejsapi=1";

    if (host === "youtu.be") {
      const videoId = url.pathname.slice(1);
      if (!videoId) {
        return null;
      }

      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}?${mobileParams}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
      };
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v") || undefined;

        if (videoId) {
          return {
            embedUrl: `https://www.youtube.com/embed/${videoId}?${mobileParams}`,
            watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
            videoId,
            playlistId,
          };
        }

        if (playlistId) {
          return {
            embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&${mobileParams}`,
            watchUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
            playlistId,
          };
        }
      }

      if (url.pathname.startsWith("/embed/")) {
        const videoId = url.pathname.split("/embed/")[1]?.split("/")[0];
        if (!videoId) {
          return null;
        }

        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}?${mobileParams}`,
          watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
          videoId,
        };
      }

      if (url.pathname === "/playlist" && playlistId) {
        return {
          embedUrl: `https://www.youtube.com/embed/videoseries?list=${playlistId}&${mobileParams}`,
          watchUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
          playlistId,
        };
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
  const [playerErrors, setPlayerErrors] = useState<Record<string, string>>({});

  const { width: screenWidth } = useWindowDimensions();
  const playerHeight = ((screenWidth - 40) * 9) / 16;
  const api = createApiClient(getApiBaseUrl());

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true);
        setError("");
        const data = await api.requestJson<{ assignments?: Assignment[] }>("/api/assignments");
        setAssignments(Array.isArray(data?.assignments) ? data.assignments : []);

        const cats = Array.from(
          new Set((data?.assignments || []).map((a) => a.category).filter(Boolean))
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

  const openVideoExternally = async (videoUrl: string) => {
    try {
      await Linking.openURL(videoUrl);
    } catch (err) {
      console.error("Failed to open assignment video", err);
      Alert.alert("Unable to open video", "Please try again in the YouTube app or your browser.");
    }
  };

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
                    style={[styles.tab, selectedCategory === tab && styles.tabActive]}
                    onPress={() => setSelectedCategory(tab)}
                  >
                    <Text style={[styles.tabText, selectedCategory === tab && styles.tabTextActive]}>{tab}</Text>
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
          const videoUrls = getYouTubeVideoUrls(item.videoLink);
          const isYouTube = !!videoUrls;
          const isPlaying = playingId === item._id;
          const playerError = playerErrors[item._id];

          return (
            <View style={styles.card}>
              <View style={[styles.videoContainer, { height: playerHeight }]}>
                {isPlaying && isYouTube ? (
                  Platform.OS === "web" ? (
                    <iframe
                      src={videoUrls.embedUrl}
                      style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : playerError ? (
                    <View style={styles.fallback}>
                      <Text style={styles.fallbackText}>This video could not be played inline.</Text>
                    </View>
                  ) : !YoutubePlayer ? (
                    <View style={styles.fallback}>
                      <Text style={styles.fallbackText}>Video player is not available on this device.</Text>
                    </View>
                  ) : (
                    <YoutubePlayer
                      height={playerHeight}
                      play
                      videoId={videoUrls.videoId}
                      playList={videoUrls.playlistId}
                      forceAndroidAutoplay
                      initialPlayerParams={{
                        controls: true,
                        rel: false,
                        preventFullScreen: false,
                        showClosedCaptions: false,
                      }}
                      webViewStyle={styles.youtubeWebView}
                      webViewProps={{
                        allowsFullscreenVideo: true,
                        mediaPlaybackRequiresUserAction: false,
                        mixedContentMode: "compatibility",
                      }}
                      onError={(playerEvent: string) => {
                        console.warn("YouTube player error:", playerEvent);
                        setPlayerErrors((current) => ({
                          ...current,
                          [item._id]: playerEvent,
                        }));
                      }}
                    />
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
                      onPress={() => {
                        if (!isYouTube) {
                          void openVideoExternally(item.videoLink);
                          return;
                        }

                        setPlayerErrors((current) => {
                          if (!current[item._id]) {
                            return current;
                          }

                          const next = { ...current };
                          delete next[item._id];
                          return next;
                        });
                        setPlayingId(item._id);
                      }}
                    >
                      <View style={styles.playIcon}>
                        <Text style={styles.playSymbol}>{"\u25B6"}</Text>
                      </View>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                {!isYouTube && (
                  <Pressable style={styles.watchButton} onPress={() => void openVideoExternally(item.videoLink)}>
                    <Text style={styles.watchButtonText}>Open Video</Text>
                  </Pressable>
                )}

                {playerError ? <Text style={styles.errorInline}>Player error: {playerError}</Text> : null}

                <View style={styles.cardMeta}>
                  {item.category && <Text style={styles.category}>{item.category}</Text>}
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
  errorInline: {
    marginBottom: 10,
    color: "#b91c1c",
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
    backgroundColor: "#000",
    position: "relative",
  },
  youtubeWebView: {
    opacity: 0.99,
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
    paddingHorizontal: 20,
  },
  fallbackText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
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
  watchButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    marginBottom: 10,
  },
  watchButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d4ed8",
    textAlign: "center",
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

