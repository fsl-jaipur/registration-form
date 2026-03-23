import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [isChecking, setIsChecking] = useState(true);

  const api = useMemo(() => createApiClient(getApiBaseUrl()), []);

  const setAuthenticated = useCallback((value: boolean, nextRole: Role = "student") => {
    setIsAuthenticated(value);
    setRole(value ? nextRole : null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      setIsChecking(true);
      const response = await api.request("/api/auth/checkToken");
      if (!response.ok) {
        setAuthenticated(false, null);
        return;
      }
      const data = (await response.json()) as { role?: Role };
      setAuthenticated(true, data.role ?? "student");
    } catch (error) {
      console.error("Auth check failed", error);
      setAuthenticated(false, null);
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
