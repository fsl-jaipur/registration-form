import { SafeAreaView, ScrollView, StyleSheet, Text, View, Image, Pressable } from "react-native";

const galleryImages = [
  require("../assets/images/hero.jpg"),
  require("../assets/images/galImg1.jpg"),
  require("../assets/images/galImg5.jpg"),
  require("../assets/images/galImg3.jpg"),
  require("../assets/images/galImg4.jpg"),
  require("../assets/images/galImg7.jpg"),
];

const wideImage = require("../assets/images/Hero-bg2.jpeg");

export default function LifeAtFSLScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.badge}>Life at FSL</Text>
          <Text style={styles.title}>
            All work & no{" "}
            <Text style={styles.titleAccentBlue}>play</Text>
            {", "}makes Jack a{" "}
            <Text style={styles.titleAccentOrange}>dull boy</Text>.
          </Text>
          <Text style={styles.subtitle}>Here at FSL, there is no dull moment.</Text>
        </View>

        <View style={styles.galleryGrid}>
          {galleryImages.map((source, index) => (
            <View key={`life-${index}`} style={styles.galleryCard}>
              <Image source={source} style={styles.galleryImage} resizeMode="cover" />
            </View>
          ))}
        </View>

        <View style={styles.wideCard}>
          <Image source={wideImage} style={styles.wideImage} resizeMode="cover" />
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Ready to Start Your Tech Career?</Text>
          <Text style={styles.ctaSubtitle}>
            Join 5000+ students who have transformed their lives with FSL.
          </Text>
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Enroll Now — It's Free to Enquire!</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#e0f2fe",
    color: "#1d4ed8",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 30,
  },
  titleAccentBlue: {
    color: "#1d4ed8",
  },
  titleAccentOrange: {
    color: "#f97316",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748b",
  },
  galleryGrid: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  galleryCard: {
    width: "47%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  galleryImage: {
    width: "100%",
    height: 120,
  },
  wideCard: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f1f5f9",
  },
  wideImage: {
    width: "100%",
    height: 160,
  },
  cta: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#4b6b8a",
  },
  ctaTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  ctaSubtitle: {
    color: "#e2e8f0",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
  ctaButton: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "700",
  },
});
