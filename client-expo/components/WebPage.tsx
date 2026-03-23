import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildWebUrl } from "../lib/webConfig";

type WebPageProps = {
  path: string;
};

export default function WebPage({ path }: WebPageProps) {
  let url = "";
  let errorMessage = "";

  try {
    url = buildWebUrl(path);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Web URL not configured.";
  }

  if (!url) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Web Page Not Configured</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView source={{ uri: url }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#b91c1c",
  },
});
