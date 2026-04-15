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
import { router, useLocalSearchParams } from "expo-router";
import { fetchCourseBySlug, fallbackCourses, type Course } from "../../lib/courseData";

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
  const courseSlug = Array.isArray(slug) ? slug[0] : slug ?? "";

  const fallbackCourse = useMemo(
    () => fallbackCourses.find((item) => (item.slug ?? "") === courseSlug),
    [courseSlug],
  );
  const [course, setCourse] = useState<Course | null>(fallbackCourse ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModule, setOpenModule] = useState<number | null>(0);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseSlug) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchCourseBySlug(courseSlug);
        setCourse(data);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course.");
      } finally {
        setLoading(false);
      }
    };

    void loadCourse();
  }, [courseSlug]);

  if (!courseSlug) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Course not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/courses")}>
            <Text style={styles.primaryButtonText}>Back to Courses</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const title = course?.title || "Course";
  const description = course?.description || course?.overview || "Course details will be updated soon.";
  const syllabus = course?.syllabus ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backRow} onPress={() => router.push("/courses")}>
          <Text style={styles.backText}>Back to Courses</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{description}</Text>
          <View style={styles.metaRow}>
            {course?.level ? <Text style={styles.metaText}>{course.level}</Text> : null}
            {course?.duration ? <Text style={styles.metaText}>{course.duration}</Text> : null}
            {course?.students ? <Text style={styles.metaText}>{course.students}</Text> : null}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About This Course</Text>
          <Text style={styles.sectionText}>{description}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What You'll Learn</Text>
          {syllabus.length ? (
            <View style={styles.learnGrid}>
              {syllabus.slice(0, 6).map((item) => (
                <View key={item} style={styles.learnItem}>
                  <View style={styles.learnDot} />
                  <Text style={styles.learnText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionText}>Syllabus will be published soon.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Course Syllabus</Text>
          <Text style={styles.sectionText}>Expand the modules to see more details and topics.</Text>

          <View style={styles.accordion}>
            {syllabus.length ? (
              syllabus.map((item, index) => {
                const opened = openModule === index;
                return (
                  <View key={`${item}-${index}`} style={styles.accordionItem}>
                    <Pressable
                      style={styles.accordionHeader}
                      onPress={() => setOpenModule(opened ? null : index)}
                    >
                      <Text style={styles.accordionTitle}>
                        Module {index + 1}: {item.length > 60 ? `${item.slice(0, 60)}...` : item}
                      </Text>
                      <Text style={styles.accordionIcon}>{opened ? "-" : "+"}</Text>
                    </Pressable>
                    {opened ? (
                      <View style={styles.accordionBody}>
                        <Text style={styles.sectionText}>{item}</Text>
                        <View style={styles.bulletList}>
                          {["Hands-on exercises", "Mini-projects", "Quizzes & assessments", "Revision and Q&A"].map(
                            (line) => (
                              <Text key={line} style={styles.bulletItem}>
                                - {line}
                              </Text>
                            ),
                          )}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.sectionText}>Detailed syllabus coming soon.</Text>
            )}
          </View>
        </View>

        <View style={styles.sideCard}>
          <Text style={styles.sideTitle}>Course Includes</Text>
          <View style={styles.bulletList}>
            {course?.duration ? <Text style={styles.bulletItem}>- {course.duration}</Text> : null}
            <Text style={styles.bulletItem}>- Live interactive sessions</Text>
            <Text style={styles.bulletItem}>- Hands-on projects</Text>
            <Text style={styles.bulletItem}>- Certificate of completion</Text>
            <Text style={styles.bulletItem}>- Placement assistance</Text>
          </View>
          <Pressable style={styles.enrollButton} onPress={() => router.push("/register")}>
            <Text style={styles.enrollText}>Enroll Now</Text>
          </Pressable>
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
  centerWrap: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  backRow: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  metaRow: {
    marginTop: 10,
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
  sectionCard: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  learnGrid: {
    marginTop: 10,
    gap: 8,
  },
  learnItem: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  learnDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    marginTop: 6,
  },
  learnText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  accordion: {
    marginTop: 10,
    gap: 8,
  },
  accordionItem: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    backgroundColor: "#f8fafc",
  },
  accordionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    paddingRight: 8,
  },
  accordionIcon: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "700",
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  bulletList: {
    marginTop: 8,
    gap: 4,
  },
  bulletItem: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  sideCard: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sideTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  enrollButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  enrollText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 12,
    fontSize: 12,
    marginTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
