import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { FooterData } from "../lib/landingData";

type LandingFooterProps = FooterData;

const openFooterLink = (href: string) => {
  if (href.startsWith("/login")) {
    router.push("/login");
    return;
  }
  if (href.startsWith("/register")) {
    router.push("/register");
    return;
  }
  if (href.startsWith("/student-panel")) {
    router.push("/student-panel");
    return;
  }
  if (href.startsWith("http")) {
    Linking.openURL(href);
  }
};

export default function LandingFooter({
  phone,
  email,
  address,
  description,
  ctaTitle,
  ctaSubtitle,
  ctaButtonLabel,
  ctaButtonHref,
  sections,
  socials,
}: LandingFooterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FullStack Learning</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.contactBox}>
        <Text style={styles.ctaTitle}>{ctaTitle}</Text>
        <Text style={styles.ctaSubtitle}>{ctaSubtitle}</Text>
        <Pressable style={styles.ctaButton} onPress={() => openFooterLink(ctaButtonHref)}>
          <Text style={styles.ctaButtonText}>{ctaButtonLabel}</Text>
        </Pressable>

        <Text style={styles.contactLabel}>Contact</Text>
        <Text style={styles.contactText}>{phone}</Text>
        <Text style={styles.contactText}>{email}</Text>
        <Text style={styles.contactText}>{address}</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionLinks}>
            {section.links.map((link) => (
              <Pressable key={`${section.title}-${link.label}`} onPress={() => openFooterLink(link.href)}>
                <Text style={styles.link}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.linksRow}>
        {socials.map((social) => (
          <Pressable key={social.label} onPress={() => openFooterLink(social.href)}>
            <Text style={styles.link}>{social.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footerNote}>© {new Date().getFullYear()} FullStack Learning</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  description: {
    color: "#cbd5f5",
    fontSize: 12,
    lineHeight: 18,
  },
  contactBox: {
    marginTop: 16,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 12,
  },
  ctaTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  ctaSubtitle: {
    color: "#cbd5f5",
    fontSize: 11,
    marginBottom: 8,
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  ctaButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  contactLabel: {
    color: "#94a3b8",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  contactText: {
    color: "#e2e8f0",
    fontSize: 12,
    marginBottom: 4,
  },
  linksRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionLinks: {
    gap: 6,
  },
  link: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600",
  },
  footerNote: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
  },
});
