import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createApiClient, extractApiErrorMessage } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";
import FormToast from "../components/FormToast";

type ChangePasswordResponse = {
  message?: string;
};

const parseJsonObject = <T,>(value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
};

export default function StudentChangePasswordScreen() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const api = createApiClient(getApiBaseUrl());

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setIsSuccess(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleChangePassword = async () => {
    if (loading) return;

    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const response = await api.request("/api/auth/changePassword", {
        method: "POST",
        body: JSON.stringify({
          email,
          password: oldPassword,
          newPassword,
        }),
      });

      const raw = await response.text();
      const data = raw ? parseJsonObject<ChangePasswordResponse>(raw) : {};

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message ?? "Password updated successfully.");
        setTimeout(() => {
          router.replace("/student-panel");
        }, 2000);
      } else {
        setIsSuccess(false);
        setMessage(extractApiErrorMessage(raw) || "Unable to update password.");
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Update your password to continue to your student dashboard.
            </Text>

            {message ? <FormToast message={message} type={isSuccess ? "success" : "error"} /> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Old Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="********"
                  secureTextEntry={!showOld}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <Pressable onPress={() => setShowOld((prev) => !prev)} style={styles.toggleButton}>
                  <Ionicons
                    name={showOld ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="********"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Pressable onPress={() => setShowNew((prev) => !prev)} style={styles.toggleButton}>
                  <Ionicons
                    name={showNew ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
      },
      default: {
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
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
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  toggleButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
