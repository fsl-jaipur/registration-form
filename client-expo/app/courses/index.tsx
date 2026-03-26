import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { fetchCourses, fallbackCourses, slugify, type Course } from "../../lib/courseData";

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>(fallbackCourses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCourses();
        setCourses(data);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };

    void loadCourses();
  }, []);

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [courses],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.badge}>Courses</Text>
          <Text style={styles.title}>
            Our <Text style={styles.titleHighlight}>Popular Courses</Text>
          </Text>
          <Text style={styles.subtitle}>Industry-aligned curriculum designed by experts.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.grid}>
          {sortedCourses.map((course) => (
            <Pressable
              key={course._id || course.slug || course.title}
              style={styles.card}
              onPress={() => {
                const slug = course.slug || (course.title ? slugify(course.title) : "");
                if (slug) {
                  router.push(`/courses/${slug}`);
                }
              }}
            >
              {course.badge ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{course.badge}</Text>
                </View>
              ) : null}
              <Text style={styles.cardTitle}>{course.title}</Text>
              <Text style={styles.cardDesc}>{course.description || course.overview || "Details coming soon."}</Text>
              <View style={styles.metaRow}>
                {course.level ? <Text style={styles.metaText}>{course.level}</Text> : null}
                {course.duration ? <Text style={styles.metaText}>{course.duration}</Text> : null}
                {course.students ? <Text style={styles.metaText}>{course.students}</Text> : null}
              </View>
              {course.tags?.length ? (
                <View style={styles.tagRow}>
                  {course.tags.slice(0, 4).map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text style={styles.linkText}>View course details</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : null}
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  titleHighlight: {
    color: "#f97316",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 12,
    fontSize: 12,
    marginBottom: 12,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgePill: {
    alignSelf: "flex-start",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgePillText: {
    color: "#f97316",
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardDesc: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    color: "#475569",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    color: "#1d4ed8",
    fontWeight: "600",
  },
  linkText: {
    marginTop: 10,
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "700",
  },
  loadingWrap: {
    marginTop: 18,
    alignItems: "center",
  },
});
