import { useContext, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Eye, EyeOff } from "lucide-react";
import { adminContext } from "@/Context/Admincontext";
import { createApiClient } from "@shared/api/client";

type StudentLoginResponse = {
  message?: string;
  loginStatus: boolean;
  firstTimeSignin?: boolean;
};

type LoginPageProps = {
  onClose?: () => void;
};

export default function LoginPage({ onClose }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated, setRole } = useContext(adminContext);
  const api = createApiClient(import.meta.env.VITE_API_URL || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const close = useMemo(
    () =>
      onClose ??
      (() => {
        const fromPath =
          (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

        if (fromPath && !fromPath.startsWith("/student") && !fromPath.startsWith("/admin")) {
          navigate(fromPath, { replace: true });
          return;
        }

        navigate("/", { replace: true });
      }),
    [location.state, navigate, onClose]
  );

  useEffect(() => {
    const t = window.requestAnimationFrame(() => setIsOpen(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleRequestClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(t);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleRequestClose = () => {
    setIsOpen(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => close(), 260);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.request("/auth/studentLogin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as StudentLoginResponse;

      if (response.ok) {
        const { message, loginStatus, firstTimeSignin } = data;

        setSuccess(message ?? "Login successful");
        setIsAuthenticated(true);
        setRole("student");

        const needsPasswordChange = firstTimeSignin ?? loginStatus ?? false;

        if (needsPasswordChange) {
          navigate("/student/changepassword");
        } else {
          navigate("/student/studentpanel");
        }

        if (onClose) {
          handleRequestClose();
        }
      } else {
        setError(data?.message ?? "Unable to login. Please try again.");
      }
    } catch (err) {
      const fallbackMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleRequestClose}
        aria-hidden="true"
      />

      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-card shadow-2xl transition-transform duration-300 will-change-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Login</h1>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted transition"
            aria-label="Close login panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and password to continue.
          </p>

          {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="*********"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-blue px-4 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logining" : "Login"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between">
       

            <p className="text-sm text-muted-foreground">
              Don't have an account?
              <button
                type="button"
                className="text-brand-blue underline ml-1"
                onClick={() => {
                  handleRequestClose();
                  window.setTimeout(() => navigate("/register"), 260);
                }}
              >
                Create an account
              </button>
            </p>
            <button
              type="button"
              className="text-sm text-brand-blue underline hover:opacity-80 transition"
              onClick={() => {
                handleRequestClose();
                window.setTimeout(() => navigate("/forgot-password"), 260);
              }}
            >
              Forgot password?
            </button>
              </div>
        </div>
      </div>
    </div>
  );
}

