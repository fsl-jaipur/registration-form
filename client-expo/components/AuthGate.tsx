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

const AUTH_ENTRY_ROUTES = new Set(["", "index", "login", "register", "forgot-password", "reset-password"]);

const getHomeRoute = (role: "student" | "admin" | null) => {
  if (role === "admin") {
    return "/admin";
  }

  return "/student-panel";
};

export default function AuthGate() {
  const segments = useSegments();
  const { isAuthenticated, isChecking, role } = useAuth();

  useEffect(() => {
    if (isChecking) return;
    const root = segments[0] ?? "";
    const isPublic = PUBLIC_ROUTES.has(root);
    const isAuthEntryRoute = AUTH_ENTRY_ROUTES.has(root);

    if (!isAuthenticated && !isPublic) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && isAuthEntryRoute) {
      router.replace(getHomeRoute(role));
    }
  }, [isAuthenticated, isChecking, role, segments]);

  return null;
}
