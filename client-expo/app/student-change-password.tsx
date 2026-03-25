import { useState } from "react";
import {
  ActivityIndicator,
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

type ChangePasswordResponse = {
  message?: string;
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

      const data = (await response.json()) as ChangePasswordResponse;

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message ?? "Password updated successfully.");
        setTimeout(() => {
          router.replace("/student-panel");
        }, 2000);
      } else {
        setIsSuccess(false);
        setMessage(data.message ?? "Unable to update password.");
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
      <View style={styles.card}>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>
          Update your password to continue to your student dashboard.
        </Text>

        {message ? (
          <View style={[styles.messageBox, isSuccess ? styles.successBox : styles.errorBox]}>
            <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text>
          </View>
        ) : null}

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
              <Text style={styles.toggleText}>{showOld ? "Hide" : "Show"}</Text>
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
              <Text style={styles.toggleText}>{showNew ? "Hide" : "Show"}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
  messageBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  successBox: {
    backgroundColor: "#dcfce7",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
  },
  successText: {
    fontSize: 12,
    color: "#166534",
  },
  errorText: {
    fontSize: 12,
    color: "#b91c1c",
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
