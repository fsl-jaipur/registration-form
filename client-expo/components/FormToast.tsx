import { Platform, StyleSheet, Text, View } from "react-native";

type FormToastProps = {
  message: string;
  type?: "error" | "success";
};

export default function FormToast({ message, type = "error" }: FormToastProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={[styles.toast, type === "success" ? styles.successToast : styles.errorToast]}>
      <Text style={[styles.text, type === "success" ? styles.successText : styles.errorText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
      },
      default: {
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  errorToast: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  successToast: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: "#dc2626",
  },
  successText: {
    color: "#15803d",
  },
});
