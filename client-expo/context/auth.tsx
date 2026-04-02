import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

type Role = "student" | "admin" | null;

type AuthContextValue = {
  isAuthenticated: boolean;
  role: Role;
  isChecking: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean, role?: Role) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "fsl_auth_session";
const AUTH_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

type StoredAuthSession = {
  role: Exclude<Role, null>;
  expiresAt: number;
};

const readStoredAuthSession = async (): Promise<StoredAuthSession | null> => {
  try {
    let raw = "";

    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return null;
      }
      raw = window.localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
    } else {
      raw = (await AsyncStorage.getItem(AUTH_STORAGE_KEY)) ?? "";
    }

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (
      (parsed.role !== "student" && parsed.role !== "admin") ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return {
      role: parsed.role,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
};

const persistAuthSession = async (value: boolean, role: Role) => {
  try {
    if (!value || !role) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return;
    }

    const payload: StoredAuthSession = {
      role,
      expiresAt: Date.now() + AUTH_SESSION_DURATION_MS,
    };

    const serialized = JSON.stringify(payload);

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      }
      return;
    }

    await AsyncStorage.setItem(AUTH_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage failures and fall back to in-memory auth.
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [isChecking, setIsChecking] = useState(true);

  const api = useMemo(() => createApiClient(getApiBaseUrl()), []);

  const setAuthenticated = useCallback((value: boolean, nextRole: Role = "student") => {
    setIsAuthenticated(value);
    setRole(value ? nextRole : null);
    void persistAuthSession(value, value ? nextRole : null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      setIsChecking(true);
      const storedSession = await readStoredAuthSession();
      const response = await api.request("/api/auth/checkToken");
      if (!response.ok) {
        if (storedSession) {
          setAuthenticated(true, storedSession.role);
        } else {
          setAuthenticated(false, null);
        }
        return;
      }
      const data = (await response.json()) as { role?: Role };
      setAuthenticated(true, data.role ?? "student");
    } catch (error) {
      console.error("Auth check failed", error);
      const storedSession = await readStoredAuthSession();
      if (storedSession) {
        setAuthenticated(true, storedSession.role);
      } else {
        setAuthenticated(false, null);
      }
    } finally {
      setIsChecking(false);
    }
  }, [api, setAuthenticated]);

  const logout = useCallback(async () => {
    try {
      await api.request("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setAuthenticated(false, null);
    }
  }, [api, setAuthenticated]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({ isAuthenticated, role, isChecking, refreshAuth, logout, setAuthenticated }),
    [isAuthenticated, role, isChecking, refreshAuth, logout, setAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
