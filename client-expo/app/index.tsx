import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/auth";

export default function IndexScreen() {
  const { isAuthenticated, isChecking, role } = useAuth();

  if (isChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={role === "admin" ? "/admin" : "/student-panel"} />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
});
