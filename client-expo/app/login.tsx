import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";
import { useAuth } from "../context/auth";

type StudentLoginResponse = {
  message?: string;
  loginStatus: boolean;
  firstTimeSignin?: boolean;
};

export default function LoginScreen() {
  const { setAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const api = createApiClient(getApiBaseUrl());

  const handleSubmit = async () => {
    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await api.requestJson<StudentLoginResponse>("/api/auth/studentLogin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data) {
        const { message, loginStatus, firstTimeSignin } = data;
        setSuccess(message ?? "Login successful");
        setAuthenticated(true, "student");

        const needsPasswordChange = firstTimeSignin ?? loginStatus ?? false;
        if (needsPasswordChange) {
          router.replace("/student-change-password");
        } else {
          router.replace("/student-panel");
        }
        router.push("/")
      }
    } catch (err) {
      const fallbackMessage =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Student Login</Text>
          <Text style={styles.subtitle}>Enter your email and password to continue.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="********"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </Pressable>

          <View style={styles.linksRow}>
            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/forgot-password")}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>
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
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 12,
  },
  success: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#1e293b",
    marginBottom: 6,
    fontWeight: "600",
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  toggleButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  linksRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  link: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
  },
});
