import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { getApiBaseUrl } from "@shared/config/api";
import {
  fetchCareerSection,
  fallbackCareerSection,
  type CareerSectionData,
} from "../lib/careerData";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

type CareerFormState = {
  candidateName: string;
  candidateEmail: string;
  phone: string;
  jobTitle: string;
  resume: PickedFile | null;
};

const initialFormState: CareerFormState = {
  candidateName: "",
  candidateEmail: "",
  phone: "",
  jobTitle: "",
  resume: null,
};

const allowedResumeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const allowedResumeExtensions = [".pdf", ".doc", ".docx"];
const maxResumeSize = 5 * 1024 * 1024;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CareerScreen() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const scrollRef = useRef<ScrollView>(null);
  const openRolesY = useRef(0);

  const [content, setContent] = useState<CareerSectionData>(fallbackCareerSection);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [formState, setFormState] = useState<CareerFormState>(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCareer = async () => {
      try {
        const data = await fetchCareerSection();
        setContent(data);
      } catch {
        setContent(fallbackCareerSection);
      } finally {
        setLoading(false);
      }
    };

    void loadCareer();
  }, []);

  const handleApplyNow = () => {
    scrollRef.current?.scrollTo({ y: openRolesY.current, animated: true });
  };

  const handleOpenModal = (jobTitle = "") => {
    setError("");
    setSuccess("");
    setFormState((prev) => ({ ...prev, jobTitle }));
    setIsApplyOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsApplyOpen(false);
  };

  const handleChange = (key: keyof CareerFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const name = asset.name || "resume";
      const extension = name.toLowerCase().slice(name.lastIndexOf("."));
      const mimeType = asset.mimeType || "application/octet-stream";

      if (!allowedResumeTypes.has(mimeType) && !allowedResumeExtensions.includes(extension)) {
        setError("Please upload your resume in PDF, DOC, or DOCX format.");
        setFormState((prev) => ({ ...prev, resume: null }));
        return;
      }

      if (asset.size && asset.size > maxResumeSize) {
        setError("Resume file size must be 5MB or smaller.");
        setFormState((prev) => ({ ...prev, resume: null }));
        return;
      }

      setError("");
      setFormState((prev) => ({
        ...prev,
        resume: {
          uri: asset.uri,
          name,
          mimeType,
          size: asset.size,
        },
      }));
    } catch {
      setError("Unable to pick resume file. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!formState.candidateName.trim()) {
      setError("Name is required.");
      setSuccess("");
      return;
    }
    if (!formState.candidateEmail.trim()) {
      setError("Email is required.");
      setSuccess("");
      return;
    }
    if (!emailPattern.test(formState.candidateEmail.trim())) {
      setError("Enter a valid email address.");
      setSuccess("");
      return;
    }
    if (!formState.phone.trim()) {
      setError("Phone number is required.");
      setSuccess("");
      return;
    }
    if (!formState.jobTitle.trim()) {
      setError("Job title is required.");
      setSuccess("");
      return;
    }
    if (!formState.resume) {
      setError("Please upload your resume in PDF, DOC, or DOCX format.");
      setSuccess("");
      return;
    }
    if (!apiBaseUrl) {
      setError("API base URL is not configured in the Expo app.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = new FormData();
      payload.append("candidateName", formState.candidateName.trim());
      payload.append("candidateEmail", formState.candidateEmail.trim().toLowerCase());
      payload.append("phone", formState.phone.trim());
      payload.append("jobTitle", formState.jobTitle.trim());
      payload.append("resume", {
        uri: formState.resume.uri,
        name: formState.resume.name,
        type: formState.resume.mimeType,
      } as any);

      const response = await fetch(`${apiBaseUrl}/apply-job`, {
        method: "POST",
        body: payload,
      });

      const rawText = await response.text();
      let data: { message?: string } = {};

      try {
        data = rawText ? (JSON.parse(rawText) as { message?: string }) : {};
      } catch {
        data = { message: rawText };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit application.");
      }

      setSuccess(data.message || "Application submitted successfully.");
      setFormState(initialFormState);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while submitting the application.";
      setError(message);
      setSuccess("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailPress = () => {
    const mailTo = `mailto:${content.ctaEmailAddress}?subject=${encodeURIComponent(
      content.ctaEmailSubject,
    )}&body=${encodeURIComponent(content.ctaEmailBody)}`;
    void Linking.openURL(mailTo);
  };

  const handlePhonePress = () => {
    const tel = `tel:${content.ctaPhoneNumber.replace(/\s+/g, "")}`;
    void Linking.openURL(tel);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.heroBadge}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {content.heroTitle} <Text style={styles.heroHighlight}>{content.heroHighlight}</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{content.heroDescription}</Text>

          <Pressable style={styles.primaryButton} onPress={handleApplyNow}>
            <Text style={styles.primaryButtonText}>{content.applyButtonLabel}</Text>
          </Pressable>

          <View style={styles.highlightGrid}>
            {content.highlightCards.map((card) => {
              const accentColor = card.accent === "brand-orange" ? "#f97316" : "#2563eb";
              return (
                <View key={card._id || card.title} style={styles.highlightCard}>
                  <View style={[styles.highlightDot, { backgroundColor: accentColor }]} />
                  <Text style={styles.highlightTitle}>{card.title}</Text>
                  <Text style={styles.highlightText}>{card.description}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={styles.section}
          onLayout={(event) => {
            openRolesY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{content.roleSectionBadge}</Text>
          </View>
          <Text style={styles.sectionTitle}>{content.roleSectionTitle}</Text>
          <Text style={styles.sectionSubtitle}>{content.roleSectionDescription}</Text>

          <View style={styles.rolesGrid}>
            {content.openings.map((opening) => (
              <View key={opening._id || opening.title} style={styles.roleCard}>
                <Text style={styles.roleType}>{opening.type}</Text>
                <Text style={styles.roleTitle}>{opening.title}</Text>
                <Text style={styles.roleLocation}>{opening.location}</Text>
                <Text style={styles.roleSummary}>{opening.summary}</Text>
                <Pressable
                  onPress={() => handleOpenModal(opening.title)}
                  style={styles.roleApplyButton}
                >
                  <Text style={styles.roleApplyText}>Apply for this role</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.splitSection}>
          <View style={styles.splitCard}>
            <Text style={styles.sectionTitle}>{content.benefitsTitle}</Text>
            {content.benefits.map((benefit) => (
              <View key={benefit} style={styles.listItem}>
                <View style={styles.listDot} />
                <Text style={styles.listText}>{benefit}</Text>
              </View>
            ))}
          </View>
          <View style={styles.splitCard}>
            <Text style={styles.sectionTitle}>{content.hiringStepsTitle}</Text>
            {content.hiringSteps.map((step, index) => (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepIndex}>
                  <Text style={styles.stepIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaEyebrow}>{content.ctaEyebrow}</Text>
          <Text style={styles.ctaTitle}>{content.ctaTitle}</Text>
          <Text style={styles.ctaDescription}>{content.ctaDescription}</Text>
          <View style={styles.ctaActions}>
            <Pressable style={styles.ctaPrimary} onPress={handleEmailPress}>
              <Text style={styles.ctaPrimaryText}>{content.ctaEmailLabel}</Text>
            </Pressable>
            <Pressable style={styles.ctaSecondary} onPress={handlePhonePress}>
              <Text style={styles.ctaSecondaryText}>{content.ctaPhoneLabel}</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : null}
      </ScrollView>

      <Modal transparent visible={isApplyOpen} animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseModal} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{content.modalTitle}</Text>
                <Text style={styles.modalSubtitle}>{content.modalDescription}</Text>
              </View>
              <Pressable onPress={handleCloseModal} disabled={submitting}>
                <Text style={styles.modalClose}>x</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={formState.candidateName}
                onChangeText={(value) => handleChange("candidateName", value)}
                editable={!submitting}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={formState.candidateEmail}
                onChangeText={(value) => handleChange("candidateEmail", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={formState.phone}
                onChangeText={(value) => handleChange("phone", value)}
                keyboardType="phone-pad"
                editable={!submitting}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput style={[styles.input, styles.inputDisabled]} value={formState.jobTitle} editable={false} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Upload your resume</Text>
              <Pressable style={styles.uploadBox} onPress={handlePickResume} disabled={submitting}>
                <Text style={styles.uploadText}>
                  {formState.resume ? formState.resume.name : "Choose File"}
                </Text>
              </Pressable>
              <Text style={styles.helperText}>{content.resumeHelperText}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>{content.submitButtonLabel}</Text>
                )}
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={handleCloseModal} disabled={submitting}>
                <Text style={styles.cancelButtonText}>{content.cancelButtonLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 34,
  },
  heroHighlight: {
    color: "#f97316",
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  highlightGrid: {
    marginTop: 16,
    gap: 12,
  },
  highlightCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#f8fafc",
  },
  highlightDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginBottom: 8,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  highlightText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: "#f97316",
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },
  rolesGrid: {
    marginTop: 14,
    gap: 12,
  },
  roleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleType: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "700",
  },
  roleTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  roleLocation: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
  roleSummary: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  roleApplyButton: {
    marginTop: 12,
  },
  roleApplyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },
  splitSection: {
    gap: 14,
    marginBottom: 20,
  },
  splitCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  listItem: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    alignItems: "flex-start",
  },
  listDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
  listText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "flex-start",
  },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#2563eb",
  },
  ctaEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "700",
  },
  ctaTitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  ctaDescription: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 18,
  },
  ctaActions: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ctaPrimary: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaPrimaryText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaSecondaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  loadingWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  modalClose: {
    fontSize: 20,
    color: "#94a3b8",
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5f5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  uploadText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "700",
  },
  helperText: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
  },
  modalActions: {
    marginTop: 6,
    gap: 10,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  cancelButtonText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 12,
    fontSize: 12,
    marginBottom: 10,
  },
  success: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: 10,
    borderRadius: 12,
    fontSize: 12,
    marginBottom: 10,
  },
});
