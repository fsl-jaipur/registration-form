import { type ReactNode, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { getApiBaseUrl } from "@shared/config/api";

type RegisterResponse = {
  message?: string;
};

type Gender = "Male" | "Female" | "Other";
type Profession = "student" | "professional";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
  fatherName: string;
  fatherPhone: string;
  localAddress: string;
  permanentAddress: string;
  qualification: string;
  qualYear: string;
  college: string;
  designation: string;
  company: string;
  course: string;
  referral: string;
  friendName: string;
};

const COURSE_OPTIONS = [
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "Database Management",
  "React Native Mobile",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Agentic AI",
];

const REFERRAL_OPTIONS = ["Google", "College/TPO", "LinkedIn", "Instagram", "Friend"];
const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Other"];

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "Male",
  fatherName: "",
  fatherPhone: "",
  localAddress: "",
  permanentAddress: "",
  qualification: "",
  qualYear: "",
  college: "",
  designation: "",
  company: "",
  course: "",
  referral: "Google",
  friendName: "",
};

export default function RegisterScreen() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [form, setForm] = useState<FormState>(initialForm);
  const [profession, setProfession] = useState<Profession>("student");
  const [sameAsLocal, setSameAsLocal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [aadharFrontFile, setAadharFrontFile] = useState<PickedFile | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<PickedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "localAddress" && sameAsLocal) {
        next.permanentAddress = value;
      }
      return next;
    });
  };

  const toggleSameAsLocal = (value: boolean) => {
    setSameAsLocal(value);
    setForm((prev) => ({
      ...prev,
      permanentAddress: value ? prev.localAddress : prev.permanentAddress,
    }));
  };

  const openTermsModal = () => {
    setTermsModalVisible(true);
  };

  const handleTermsTogglePress = () => {
    if (termsAccepted) {
      setTermsAccepted(false);
      return;
    }
    openTermsModal();
  };

  const handleTermsAgree = () => {
    setTermsAccepted(true);
    setTermsModalVisible(false);
  };

  const handleTermsCancel = () => {
    setTermsAccepted(false);
    setTermsModalVisible(false);
  };

  const pickDocument = async (side: "front" | "back") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const file: PickedFile = {
        uri: asset.uri,
        name: asset.name || `aadhar-${side}`,
        mimeType: asset.mimeType || "application/octet-stream",
      };

      if (side === "front") {
        setAadharFrontFile(file);
      } else {
        setAadharBackFile(file);
      }
    } catch {
      setError("Unable to pick file. Please try again.");
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setProfession("student");
    setSameAsLocal(false);
    setTermsAccepted(false);
    setTermsModalVisible(false);
    setCourseModalVisible(false);
    setAadharFrontFile(null);
    setAadharBackFile(null);
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(form.email.trim())) return "Enter a valid email address.";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) return "Enter a valid 10-digit phone number.";
    if (!form.dob.trim()) return "Date of birth is required.";
    if (!form.fatherName.trim()) return "Father's name is required.";
    if (!/^\d{10}$/.test(form.fatherPhone.replace(/\D/g, ""))) return "Enter a valid father's phone number.";
    if (!form.localAddress.trim()) return "Local address is required.";
    if (!form.permanentAddress.trim()) return "Permanent address is required.";
    if (!aadharFrontFile) return "Please select Aadhaar front file.";
    if (!aadharBackFile) return "Please select Aadhaar back file.";
    if (!form.course.trim()) return "Please select a course.";
    if (!form.referral.trim()) return "Please select a referral source.";
    if (profession === "student") {
      if (!form.qualification.trim()) return "Qualification is required.";
      if (!/^\d{4}$/.test(form.qualYear.trim())) return "Enter a valid qualification year.";
      if (!form.college.trim()) return "College is required.";
    }
    if (profession === "professional") {
      if (!form.designation.trim()) return "Designation is required.";
      if (!form.company.trim()) return "Company is required.";
    }
    if (form.referral === "Friend" && !form.friendName.trim()) return "Friend name is required.";
    if (!termsAccepted) return "Please accept terms and conditions.";
    if (!apiBaseUrl) return "API base URL is not configured in the Expo app.";
    return "";
  };

  const handleSubmit = async () => {
    if (loading || !termsAccepted) return;

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("email", form.email.trim().toLowerCase());
      payload.append("phone", form.phone.trim());
      payload.append("dob", form.dob.trim());
      payload.append("gender", form.gender);
      payload.append("fatherName", form.fatherName.trim());
      payload.append("fatherPhone", form.fatherPhone.trim());
      payload.append("localAddress", form.localAddress.trim());
      payload.append("permanentAddress", form.permanentAddress.trim());
      payload.append("qualification", profession === "student" ? form.qualification.trim() : "");
      payload.append("qualYear", profession === "student" ? form.qualYear.trim() : "");
      payload.append("college", profession === "student" ? form.college.trim() : "");
      payload.append("designation", profession === "professional" ? form.designation.trim() : "");
      payload.append("company", profession === "professional" ? form.company.trim() : "");
      payload.append("course", form.course.trim());
      payload.append("referral", form.referral.trim());
      payload.append("friendName", form.referral === "Friend" ? form.friendName.trim() : "");
      payload.append("tcAccepted", String(termsAccepted));
      payload.append("aadharFront", {
        uri: aadharFrontFile!.uri,
        name: aadharFrontFile!.name,
        type: aadharFrontFile!.mimeType,
      } as any);
      payload.append("aadharBack", {
        uri: aadharBackFile!.uri,
        name: aadharBackFile!.name,
        type: aadharBackFile!.mimeType,
      } as any);

      const response = await fetch(`${apiBaseUrl}/api/students/register`, {
        method: "POST",
        body: payload,
      });

      const rawText = await response.text();
      let data: RegisterResponse = {};

      try {
        data = rawText ? (JSON.parse(rawText) as RegisterResponse) : {};
      } catch {
        data = { message: rawText };
      }

      if (!response.ok) {
        throw new Error(data.message || "Registration failed. Please try again.");
      }

      setSuccess(data.message || "Registration successful. Please check your email for login details.");
      resetForm();
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <Text style={styles.title}>Registration Form</Text>
            <Text style={styles.subtitle}>Fill in your details to register</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <SectionCard title="Personal Details">
            <Field label="Name *" placeholder="Full Name" value={form.name} onChangeText={(v) => updateField("name", v)} />
            <Field
              label="Email *"
              placeholder="Email Address"
              value={form.email}
              onChangeText={(v) => updateField("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Phone *"
              placeholder="Phone Number"
              value={form.phone}
              onChangeText={(v) => updateField("phone", v)}
              keyboardType="phone-pad"
            />
            <Field
              label="Date of Birth *"
              placeholder="YYYY-MM-DD"
              value={form.dob}
              onChangeText={(v) => updateField("dob", v)}
            />

            <Label text="Gender *" />
            <ChipRow
              options={GENDER_OPTIONS}
              selected={form.gender}
              onSelect={(value) => updateField("gender", value)}
            />

            <Field
              label="Father's Name *"
              placeholder="Father's Name"
              value={form.fatherName}
              onChangeText={(v) => updateField("fatherName", v)}
            />
            <Field
              label="Father's Phone *"
              placeholder="Father's Phone"
              value={form.fatherPhone}
              onChangeText={(v) => updateField("fatherPhone", v)}
              keyboardType="phone-pad"
            />
          </SectionCard>

          <SectionCard title="Address Details">
            <Field
              label="Local Address *"
              placeholder="Enter local address"
              value={form.localAddress}
              onChangeText={(v) => updateField("localAddress", v)}
              multiline
            />

            <View style={styles.switchRow}>
              <Switch
                value={sameAsLocal}
                onValueChange={toggleSameAsLocal}
                trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                thumbColor={sameAsLocal ? "#2563eb" : "#ffffff"}
              />
              <Text style={styles.switchText}>Same as Local Address</Text>
            </View>

            <Field
              label="Permanent Address *"
              placeholder="Enter permanent address"
              value={form.permanentAddress}
              onChangeText={(v) => updateField("permanentAddress", v)}
              multiline
              editable={!sameAsLocal}
            />
          </SectionCard>

          <SectionCard title="Aadhar Card Upload">
            <UploadField
              label="Aadhar Card (Front) *"
              file={aadharFrontFile}
              onPress={() => pickDocument("front")}
            />
            <UploadField
              label="Aadhar Card (Back) *"
              file={aadharBackFile}
              onPress={() => pickDocument("back")}
            />
          </SectionCard>

          <SectionCard title="Professional Details">
            <ChipRow
              options={[
                { label: "Student", value: "student" },
                { label: "Working Professional", value: "professional" },
              ]}
              selected={profession}
              onSelect={(value) => setProfession(value as Profession)}
            />

            {profession === "student" ? (
              <>
                <Field
                  label="Qualification *"
                  placeholder="e.g. B.Tech"
                  value={form.qualification}
                  onChangeText={(v) => updateField("qualification", v)}
                />
                <Field
                  label="Year *"
                  placeholder="e.g. 2024"
                  value={form.qualYear}
                  onChangeText={(v) => updateField("qualYear", v)}
                  keyboardType="number-pad"
                />
                <Field
                  label="College *"
                  placeholder="College Name"
                  value={form.college}
                  onChangeText={(v) => updateField("college", v)}
                />
              </>
            ) : (
              <>
                <Field
                  label="Designation *"
                  placeholder="Your Designation"
                  value={form.designation}
                  onChangeText={(v) => updateField("designation", v)}
                />
                <Field
                  label="Company *"
                  placeholder="Company Name"
                  value={form.company}
                  onChangeText={(v) => updateField("company", v)}
                />
              </>
            )}
          </SectionCard>

          <SectionCard title="Course & Referral">
            <Label text="Course *" />
            <Pressable style={styles.dropdownField} onPress={() => setCourseModalVisible(true)}>
              <Text style={form.course ? styles.dropdownValue : styles.dropdownPlaceholder}>
                {form.course || "Select a course"}
              </Text>
              <Text style={styles.dropdownArrow}>v</Text>
            </Pressable>

            <Label text="How did you hear about us? *" />
            <ChipRow
              options={REFERRAL_OPTIONS}
              selected={form.referral}
              onSelect={(value) => updateField("referral", value)}
            />

            {form.referral === "Friend" ? (
              <Field
                label="Friend Name *"
                placeholder="Friend Name"
                value={form.friendName}
                onChangeText={(v) => updateField("friendName", v)}
              />
            ) : null}
          </SectionCard>

          <SectionCard title="Terms & Conditions">
            <View style={styles.termsRow}>
              <Pressable style={[styles.checkbox, termsAccepted && styles.checkboxChecked]} onPress={handleTermsTogglePress}>
                {termsAccepted ? <Text style={styles.checkboxTick}>✓</Text> : null}
              </Pressable>
              <Pressable onPress={openTermsModal} style={styles.termsTextWrap}>
                <Text style={styles.switchText}>
                  I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text>
                </Text>
              </Pressable>
            </View>
          </SectionCard>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.submitButton,
              (!termsAccepted || loading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !termsAccepted}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Submit Registration</Text>}
          </Pressable>

          <Pressable style={styles.loginLinkWrap} onPress={() => router.push("/login")}>
            <Text style={styles.loginLink}>Already registered? Login</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectionModal
        visible={courseModalVisible}
        title="Select a Course"
        options={COURSE_OPTIONS}
        selected={form.course}
        onClose={() => setCourseModalVisible(false)}
        onSelect={(value) => {
          updateField("course", value);
          setCourseModalVisible(false);
        }}
      />

      <Modal animationType="fade" transparent visible={termsModalVisible} onRequestClose={handleTermsCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <Pressable onPress={handleTermsCancel}>
                <Text style={styles.modalClose}>x</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtext}>Please read and accept our terms to proceed with registration.</Text>
            <Text style={styles.modalParagraph}>
              By registering you agree to abide by the rules and policies of the institute. You confirm that the
              information provided is true and accurate to the best of your knowledge.
            </Text>
            <Text style={styles.modalParagraph}>
              Fee, refund and attendance policies apply as per the course specific guidelines. Any fraudulent activity
              may lead to cancellation of registration.
            </Text>
            <Text style={styles.modalParagraph}>
              Personal data will be processed in accordance with our privacy practices.
            </Text>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={handleTermsCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalAgreeButton} onPress={handleTermsAgree}>
                <Text style={styles.modalAgreeText}>Agree</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad";
  multiline?: boolean;
  editable?: boolean;
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  autoCapitalize = "sentences",
  keyboardType = "default",
  multiline = false,
  editable = true,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

function UploadField({
  label,
  file,
  onPress,
}: {
  label: string;
  file: PickedFile | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.uploadBox} onPress={onPress}>
        <Text style={styles.uploadIcon}>^</Text>
        <Text style={styles.uploadText}>{file ? file.name : "Click to upload"}</Text>
      </Pressable>
    </View>
  );
}

type ChipOption = string | { label: string; value: string };

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const label = typeof option === "string" ? option : option.label;
        const value = typeof option === "string" ? option : option.value;
        const active = selected === value;

        return (
          <Pressable
            key={value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SelectionModal({
  visible,
  title,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.selectionCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.modalClose}>x</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = selected === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.selectionItem, active && styles.selectionItemActive]}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.selectionText, active && styles.selectionTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f8ff",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    paddingVertical: 12,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748b",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 12,
  },
  success: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7e3f4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#0f172a",
  },
  inputMultiline: {
    minHeight: 92,
  },
  inputDisabled: {
    backgroundColor: "#f8fafc",
    color: "#64748b",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  chipActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  chipTextActive: {
    color: "#1d4ed8",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
  },
  dropdownField: {
    borderWidth: 1,
    borderColor: "#d7e3f4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownPlaceholder: {
    color: "#94a3b8",
    fontSize: 14,
  },
  dropdownValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    paddingRight: 12,
  },
  dropdownArrow: {
    color: "#64748b",
    fontSize: 16,
  },
  uploadBox: {
    minHeight: 120,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#bfdbfe",
    borderRadius: 16,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  uploadIcon: {
    fontSize: 28,
    color: "#64748b",
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
  },
  checkboxTick: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  termsTextWrap: {
    flex: 1,
  },
  termsLink: {
    color: "#2563eb",
    textDecorationLine: "underline",
  },
  submitButton: {
    backgroundColor: "#2f7abf",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9dbad3",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  loginLinkWrap: {
    alignItems: "center",
    paddingVertical: 14,
  },
  loginLink: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
  },
  selectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },
  modalClose: {
    fontSize: 22,
    color: "#64748b",
  },
  modalSubtext: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 18,
  },
  modalParagraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#64748b",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    borderWidth: 1.5,
    borderColor: "#2f7abf",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  modalCancelText: {
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "700",
  },
  modalAgreeButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#2f7abf",
  },
  modalAgreeText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  selectionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  selectionItemActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  selectionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },
  selectionTextActive: {
    color: "#1d4ed8",
  },
});
