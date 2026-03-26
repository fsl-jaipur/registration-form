import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function CareerScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Career</Text>
          <Text style={styles.title}>Career Path With FSL</Text>
          <Text style={styles.subtitle}>
            Build the skills, project experience, and interview confidence needed to move into tech roles.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Placement Preparation</Text>
          <Text style={styles.cardText}>
            Resume building, interview preparation, and guided project work are included to make students hiring-ready.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Industry-Focused Training</Text>
          <Text style={styles.cardText}>
            Learning paths are shaped around the skills companies expect from frontend, backend, mobile, and full
            stack developers.
          </Text>
        </View>

        <Pressable style={styles.button} onPress={() => router.push("/register")}>
          <Text style={styles.buttonText}>Register Now</Text>
        </Pressable>
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
  hero: {
    backgroundColor: "#1d4ed8",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#dbeafe",
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#f97316",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
