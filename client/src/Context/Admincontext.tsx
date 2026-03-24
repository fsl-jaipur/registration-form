import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Role = "student" | "admin" | null;

type AdminContextValue = {
  isAuthenticated: boolean;
  role: Role;
  authChecked: boolean;
  checkToken: () => Promise<void>;
  logout: () => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  setRole: (role: Role) => void;
};

const noop = () => {};
const storageKeys = {
  auth: "fsl_isAuthenticated",
  role: "fsl_role",
};

export const adminContext = createContext<AdminContextValue>({
  isAuthenticated: false,
  role: null,
  authChecked: false,
  checkToken: async () => {},
  logout: async () => {},
  setIsAuthenticated: noop,
  setRole: noop,
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(storageKeys.auth) === "true";
  });
  const [role, setRole] = useState<Role>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedRole = localStorage.getItem(storageKeys.role);
    return storedRole === "student" || storedRole === "admin" ? storedRole : null;
  });
  const [authChecked, setAuthChecked] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

  // Persist to localStorage whenever auth state changes
  useEffect(() => {
    localStorage.setItem(storageKeys.auth, String(isAuthenticated));
    if (role) {
      localStorage.setItem(storageKeys.role, role);
    } else {
      localStorage.removeItem(storageKeys.role);
    }
  }, [isAuthenticated, role]);

  const checkToken = async () => {
    if (!API_BASE) {
      console.warn("API base URL missing; skip token check");
      setAuthChecked(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/checkToken`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setIsAuthenticated(false);
        setRole(null);
        return;
      }

      const data = await res.json();
      setIsAuthenticated(true);
      setRole((data?.role as Role) ?? null);
    } catch (error) {
      console.error("checkToken failed", error);
      setIsAuthenticated(false);
      setRole(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const logout = async () => {
    if (!API_BASE) {
      setIsAuthenticated(false);
      setRole(null);
      setAuthChecked(true);
      return;
    }

    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("logout failed", error);
    } finally {
      setIsAuthenticated(false);
      setRole(null);
      setAuthChecked(true);
    }
  };

  // On mount, verify the persisted session with the API.
  useEffect(() => {
    checkToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      role,
      authChecked,
      checkToken,
      logout,
      setIsAuthenticated,
      setRole,
    }),
    [isAuthenticated, role, authChecked]
  );

  return <adminContext.Provider value={value}>{children}</adminContext.Provider>;
};

export const useAdminContext = () => useContext(adminContext);
