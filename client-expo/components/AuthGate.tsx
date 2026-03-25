import { useEffect } from "react";
import { useSegments, router } from "expo-router";
import { useAuth } from "../context/auth";

const PUBLIC_ROUTES = new Set([
  "",
  "index",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "lifeatfsl",
  "career",
  "privacy-policy",
  "terms-of-service",
  "sitemap",
  "courses",
  "admin",
]);

export default function AuthGate() {
  const segments = useSegments();
  const { isAuthenticated, isChecking } = useAuth();

  useEffect(() => {
    if (isChecking) return;
    const root = segments[0] ?? "";
    const isPublic = PUBLIC_ROUTES.has(root);

    if (!isAuthenticated && !isPublic) {
      router.replace("/");
      return;
    }
  }, [isAuthenticated, isChecking, segments]);

  return null;
}
