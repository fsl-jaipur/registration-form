import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { router } from "expo-router";
import LandingHeader from "../components/LandingHeader";
import LandingFooter from "../components/LandingFooter";
import {
  fallbackCompanies,
  fallbackGetInTouch,
  fallbackFooter,
  fallbackHeader,
  fallbackHero,
  fetchLandingData,
  fetchCompaniesSection,
  fetchCourses,
  fetchEngineeringTeam,
  fetchGetInTouch,
  fetchPlacedStudents,
  fetchTestimonials,
  resolveRemoteAsset,
  type CompaniesSectionData,
  type Course,
  type EngineeringMember,
  type GetInTouchData,
  type PlacedStudent,
  type Testimonial,
} from "../lib/landingData";

const heroImage = require("../assets/images/hero.jpg");

export default function LandingScreen() {
  const [header, setHeader] = useState(fallbackHeader);
  const [hero, setHero] = useState(fallbackHero);
  const [footer, setFooter] = useState(fallbackFooter);
  const [courses, setCourses] = useState<Course[]>([]);
  const [placedStudents, setPlacedStudents] = useState<PlacedStudent[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [companies, setCompanies] = useState<CompaniesSectionData>(fallbackCompanies);
  const [team, setTeam] = useState<EngineeringMember[]>([]);
  const [getInTouch, setGetInTouch] = useState<GetInTouchData>(fallbackGetInTouch);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchLandingData()
      .then((data) => {
        if (!mounted) return;
        setHeader(data.header);
        setHero(data.hero);
        setFooter(data.footer);
      })
      .catch((error) => {
        console.error("Failed to load landing data", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchCourses(),
      fetchPlacedStudents(),
      fetchTestimonials(),
      fetchCompaniesSection(),
      fetchEngineeringTeam(),
      fetchGetInTouch(),
    ])
      .then(([coursesData, placedData, testimonialData, companiesData, teamData, getInTouchData]) => {
        if (!mounted) return;
        setCourses(coursesData);
        setPlacedStudents(placedData);
        setTestimonials(testimonialData);
        setCompanies(companiesData);
        setTeam(teamData);
        setGetInTouch(getInTouchData);
      })
      .catch((error) => {
        console.error("Failed to load landing sections", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const heroImageSource = useMemo(() => {
    const first = hero.images?.[0]?.url;
    const resolved = resolveRemoteAsset(first);
    if (first?.includes("/images/hero") || first?.includes("/images/Hero")) {
      return heroImage;
    }
    if (resolved && /^https?:\/\//i.test(resolved)) {
      return { uri: resolved };
    }
    return heroImage;
  }, [hero.images]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <LandingHeader
          phone={header.phone || "+91-8824453320"}
          email={header.email || "rohit@fullstacklearning.com"}
          logo={header.logo}
          logoAlt={header.logoAlt}
          navItems={header.navItems}
          buttons={header.buttons}
        />

        <ImageBackground source={heroImageSource} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{hero.badgeText}</Text>
            </View>

            <Text style={styles.heroTitle}>{hero.title}</Text>
            <Text style={styles.heroHighlight}>{hero.animatedWords?.[2] || "Backend Engineer"}</Text>
            <Text style={styles.heroSub}>
              {hero.highlightPrefix}{" "}
              <Text style={styles.heroSubEmphasis}>{hero.highlightNumber}</Text>{" "}
              {hero.highlightSuffix}
            </Text>
            <Text style={styles.heroDescription}>{hero.description}</Text>

            <View style={styles.heroButtons}>
              {hero.buttons.map((button) => (
                <Pressable
                  key={button.label}
                  style={button.style === "outline" ? styles.secondaryButton : styles.primaryButton}
                  onPress={() => {
                    if (button.href.startsWith("/register")) router.push("/register");
                    else router.push("/login");
                  }}
                >
                  <Text
                    style={button.style === "outline" ? styles.secondaryButtonText : styles.primaryButtonText}
                  >
                    {button.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ImageBackground>

        <View style={styles.statsRow}>
          {hero.stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>
                {stat.value}
                {stat.suffix || ""}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionBadge}>About FSL</Text>
          <Text style={styles.sectionTitle}>
            A Learning Platform To Help You <Text style={styles.sectionHighlight}>Jump Into Tech</Text>
          </Text>
          <Text style={styles.sectionText}>
            CS degree is no longer a barrier. We focus on skills, real projects, and placement support.
          </Text>
          <View style={styles.featureGrid}>
            {[
              { title: "Industry-Aligned Curriculum", description: "Learn what employers want." },
              { title: "Expert Mentors", description: "10+ years of industry experience." },
              { title: "Hands-On Learning", description: "Build 10+ real projects." },
              { title: "Placement Support", description: "Resume + interview prep." },
            ].map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureText}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionAlt}>
          <Text style={styles.sectionBadgeBlue}>What We Offer</Text>
          <Text style={styles.sectionTitle}>
            Our <Text style={styles.sectionHighlight}>Popular Courses</Text>
          </Text>
          <Text style={styles.sectionText}>
            Industry-aligned curriculum designed by experts.
          </Text>
          <View style={styles.courseGrid}>
            {(courses.length ? courses : []).slice(0, 6).map((course) => (
              <View key={course._id || course.title} style={styles.courseCard}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDesc}>{course.description}</Text>
                <View style={styles.courseMetaRow}>
                  {course.duration ? <Text style={styles.courseMeta}>{course.duration}</Text> : null}
                  {course.students ? <Text style={styles.courseMeta}>{course.students}</Text> : null}
                  {course.rating ? <Text style={styles.courseMeta}>★ {course.rating}</Text> : null}
                </View>
              </View>
            ))}
            {courses.length === 0 ? (
              <Text style={styles.sectionText}>Courses will appear here soon.</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionBadge}>Our Placed Students</Text>
          <Text style={styles.sectionTitle}>
            Success is <Text style={styles.sectionHighlight}>Our Story</Text>
          </Text>
          <View style={styles.placedGrid}>
            {placedStudents.slice(0, 8).map((student) => (
              <View key={`${student.name}-${student.company}`} style={styles.placedCard}>
                {student.image ? (
                  <Image source={{ uri: student.image }} style={styles.placedImage} />
                ) : (
                  <View style={styles.placedImage} />
                )}
                <Text style={styles.placedName}>{student.name}</Text>
                <Text style={styles.placedRole}>{student.role}</Text>
                <Text style={styles.placedMeta}>{student.company}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionAlt}>
          <Text style={styles.sectionBadgeOrange}>Success Stories</Text>
          <Text style={styles.sectionTitle}>
            What Our <Text style={styles.sectionHighlight}>Students Say</Text>
          </Text>
          <View style={styles.testimonialGrid}>
            {testimonials.slice(0, 6).map((t) => (
              <View key={t._id || t.name} style={styles.testimonialCard}>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <View style={styles.testimonialFooter}>
                  {t.image ? (
                    <Image source={{ uri: t.image }} style={styles.testimonialAvatar} />
                  ) : (
                    <View style={styles.testimonialAvatar} />
                  )}
                  <View>
                    <Text style={styles.testimonialName}>{t.name}</Text>
                    <Text style={styles.testimonialRating}>★ {t.rating}</Text>
                  </View>
                </View>
              </View>
            ))}
            {testimonials.length === 0 ? (
              <Text style={styles.sectionText}>Success stories will appear here soon.</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionBadgeOrange}>{companies.badgeText}</Text>
          <Text style={styles.sectionTitle}>{companies.heading}</Text>
          <Text style={styles.sectionText}>{companies.description}</Text>
          <View style={styles.companyRow}>
            {companies.companies.slice(0, 10).map((company) => (
              <View key={company.name} style={styles.companyChip}>
                <Text style={styles.companyText}>{company.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionAlt}>
          <Text style={styles.sectionBadgeOrange}>Engineering Team</Text>
          <Text style={styles.sectionTitle}>
            The people behind <Text style={styles.sectionHighlight}>Full Stack Learning</Text>
          </Text>
          <View style={styles.teamGrid}>
            {team.map((member) => (
              <View key={member._id || member.name} style={styles.teamCard}>
                {member.photo ? (
                  <Image source={{ uri: member.photo }} style={styles.teamImage} />
                ) : (
                  <View style={styles.teamImage} />
                )}
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.title}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionBadgeBlue}>{getInTouch.badgeText}</Text>
          <Text style={styles.sectionTitle}>
            {getInTouch.heading} <Text style={styles.sectionHighlight}>{getInTouch.highlight}</Text>
          </Text>
          <Text style={styles.sectionText}>{getInTouch.description}</Text>
          <View style={styles.enquiryCard}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={form.phone}
              onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={form.email}
              onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Course Interested In"
              value={form.course}
              onChangeText={(text) => setForm((prev) => ({ ...prev, course: text }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Message"
              multiline
              value={form.message}
              onChangeText={(text) => setForm((prev) => ({ ...prev, message: text }))}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={async () => {
                try {
                  const formData = new FormData();
                  formData.append("name", form.name);
                  formData.append("email", form.email);
                  formData.append("phone", form.phone);
                  formData.append("course", form.course);
                  formData.append("message", form.message);
                  formData.append("access_key", getInTouch.accessKey);
                  const res = await fetch(getInTouch.formEndpoint, {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  setFormStatus(data.success ? "Form submitted successfully" : "Submission failed");
                } catch {
                  setFormStatus("Submission failed");
                }
              }}
            >
              <Text style={styles.primaryButtonText}>Submit Enquiry</Text>
            </Pressable>
            {formStatus ? <Text style={styles.sectionText}>{formStatus}</Text> : null}
          </View>
        </View>

        <LandingFooter {...footer} />
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
    paddingBottom: 24,
  },
  hero: {
    height: 420,
    justifyContent: "flex-end",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 67, 115, 0.75)",
  },
  heroContent: {
    padding: 20,
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
  },
  heroHighlight: {
    color: "#f97316",
    fontSize: 30,
    fontWeight: "800",
  },
  heroSub: {
    color: "#e2e8f0",
    fontSize: 16,
    marginTop: 4,
  },
  heroSubEmphasis: {
    color: "#f97316",
    fontSize: 22,
    fontWeight: "800",
  },
  heroDescription: {
    color: "#e2e8f0",
    fontSize: 12,
    lineHeight: 18,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f97316",
  },
  statLabel: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 8,
  },
  sectionAlt: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 8,
    backgroundColor: "#f8fafc",
    paddingVertical: 16,
  },
  sectionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    color: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
  },
  sectionBadgeBlue: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
  },
  sectionBadgeOrange: {
    alignSelf: "flex-start",
    backgroundColor: "#ffedd5",
    color: "#c2410c",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionHighlight: {
    color: "#f97316",
  },
  sectionText: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  featureGrid: {
    marginTop: 12,
    gap: 12,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: "#64748b",
  },
  courseGrid: {
    marginTop: 12,
    gap: 12,
  },
  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  courseDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 6,
  },
  courseMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  courseMeta: {
    fontSize: 11,
    color: "#94a3b8",
  },
  placedGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  placedCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  placedImage: {
    height: 90,
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    marginBottom: 8,
  },
  placedName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  placedRole: {
    fontSize: 11,
    color: "#2563eb",
  },
  placedMeta: {
    fontSize: 11,
    color: "#64748b",
  },
  testimonialGrid: {
    marginTop: 12,
    gap: 12,
  },
  testimonialCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  testimonialText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 10,
  },
  testimonialFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  testimonialAvatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  testimonialName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  testimonialRating: {
    fontSize: 11,
    color: "#f59e0b",
  },
  companyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  companyChip: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  companyText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  teamGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  teamCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  teamImage: {
    height: 120,
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    marginBottom: 8,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  teamRole: {
    fontSize: 11,
    color: "#64748b",
  },
  enquiryCard: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
});
