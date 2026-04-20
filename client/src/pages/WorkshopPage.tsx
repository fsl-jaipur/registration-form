import { useEffect, useState } from "react";
import { Award, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  checkWorkshopSession,
  downloadCertificate,
  fetchWorkshop,
  loginWorkshopParticipant,
  logoutWorkshopParticipant,
  registerWorkshopParticipant,
} from "@/features/workshop/api";
import type { Step, WorkshopData } from "@/features/workshop/types";
import { useToast } from "@/hooks/use-toast";

const WORKSHOP_SLUG = "agentic-ai";

export default function WorkshopPage() {
  const { toast } = useToast();

  const [workshop, setWorkshop] = useState<WorkshopData | null>(null);
  const [loadingWorkshop, setLoadingWorkshop] = useState(true);
  const [workshopError, setWorkshopError] = useState("");

  const [step, setStep] = useState<Step>("register");
  const [participantName, setParticipantName] = useState("");
  const [participantEnrollmentId, setParticipantEnrollmentId] = useState("");
  const [participantCertificateDownloaded, setParticipantCertificateDownloaded] =
    useState(false);

  const [enrollmentId, setEnrollmentId] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [workshopData, session] = await Promise.all([
          fetchWorkshop(WORKSHOP_SLUG),
          checkWorkshopSession(WORKSHOP_SLUG).catch(() => ({ authenticated: false })),
        ]);
        setWorkshop(workshopData);

        if (session.authenticated && session.name) {
          setParticipantName(session.name);
          setParticipantEnrollmentId(session.enrollmentId || "");
          setParticipantCertificateDownloaded(Boolean(session.certificateDownloaded));
          setStep("content");
        }
      } catch {
        setWorkshopError("Workshop not found or unavailable.");
      } finally {
        setLoadingWorkshop(false);
      }
    };

    void load();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (
      !enrollmentId.trim() ||
      !registerEmail.trim() ||
      !phone.trim() ||
      !registerPassword.trim()
    ) {
      setRegisterError("All fields are required.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setRegisterError("Phone number must be exactly 10 digits.");
      return;
    }

    setRegisterLoading(true);
    try {
      const result = await registerWorkshopParticipant(
        WORKSHOP_SLUG,
        enrollmentId.trim(),
        registerEmail.trim(),
        phone.trim(),
        registerPassword,
      );

      setParticipantName(result.name);
      setLoginEmail(registerEmail.trim());
      setLoginPassword("");
      setStep("login");
      toast({
        title: "Registration successful",
        description: "Please log in with your email and password.",
      });
    } catch (err) {
      setRegisterError(
        err instanceof Error ? err.message : "Registration failed. Please try again.",
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Email and password are required.");
      return;
    }

    setLoginLoading(true);
    try {
      const result = await loginWorkshopParticipant(
        WORKSHOP_SLUG,
        loginEmail.trim(),
        loginPassword,
      );
      setParticipantName(result.name);
      setParticipantEnrollmentId(result.enrollmentId);
      setParticipantCertificateDownloaded(Boolean(result.certificateDownloaded));
      setStep("content");
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutWorkshopParticipant(WORKSHOP_SLUG);
    } catch {
      // Ignore network/logout errors and still reset local state.
    }

    setParticipantName("");
    setParticipantEnrollmentId("");
    setParticipantCertificateDownloaded(false);
    setLoginPassword("");
    setStep("login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const handleDownloadCertificate = async () => {
    setCertLoading(true);
    try {
      await downloadCertificate(WORKSHOP_SLUG);
      setParticipantCertificateDownloaded(true);
      toast({
        title: "Certificate downloaded",
        description: "Certificate can be downloaded only once.",
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCertLoading(false);
    }
  };

  const capitalize = (value: string) => {
    return value.length > 1
      ? value.indexOf(" ") !== -1
        ? value
            .split(" ")
            .map((n) => n.slice(0, 1).toUpperCase() + n.slice(1))
            .join(" ")
        : value.slice(0, 1).toUpperCase() + value.slice(1)
      : value;
  };

  if (loadingWorkshop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (workshopError || !workshop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Award className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Workshop Not Found</h1>
        <p className="text-muted-foreground">
          {workshopError || "This workshop does not exist."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Award className="h-6 w-6 text-primary flex-shrink-0" />
          <span className="text-base font-semibold truncate">{workshop.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {step !== "content" && (
          <div className="mb-8 inline-flex rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => {
                setRegisterError("");
                setStep("register");
              }}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                step === "register"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginError("");
                setStep("login");
              }}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                step === "login"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
          </div>
        )}

        {step === "register" && (
          <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
            <h1 className="mb-1 text-2xl font-bold">Register</h1>
            <p className="mb-8 text-muted-foreground text-sm">
              Enter your details. Enrollment number must already exist in the workshop
              participant list.
            </p>

            <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Enrollment No. *</span>
                <input
                  type="text"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                  placeholder="e.g. 38889"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Email *</span>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="email"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Phone No. *</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="tel"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Password *</span>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              {registerError && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {registerError}
                </p>
              )}

              <button
                type="submit"
                disabled={registerLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          </div>
        )}

        {step === "login" && (
          <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
            <h1 className="mb-1 text-2xl font-bold">Login</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Login with your registered email and password.
            </p>

            <form onSubmit={(e) => void handleLoginSubmit(e)} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Email *</span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  autoComplete="email"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Password *</span>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              {loginError && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        )}

        {step === "content" && (
          <div className="space-y-8">
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Welcome back,</p>
                  <h1 className="text-3xl font-bold text-foreground">
                    {capitalize(participantName)}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enrollment No: <span className="font-medium text-foreground">{participantEnrollmentId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold">{workshop.title}</h2>
                  {workshop.date && (
                    <p className="mt-1 text-sm text-muted-foreground">{workshop.date}</p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    workshop.certificateEnabled
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {workshop.certificateEnabled
                    ? "Certificate available"
                    : "Certificate coming soon"}
                </span>
              </div>

              {workshop.description && (
                <div className="border-t border-border pt-4">
                  {workshop.description.split("\n").map((line, i) => (
                    <p
                      key={i}
                      className={`text-sm leading-7 text-muted-foreground ${
                        line.trim() === "" ? "mt-3" : ""
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Certificate of Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    {workshop.certificateEnabled
                      ? "Your certificate is ready."
                      : "Your certificate will be available once the workshop is completed."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleDownloadCertificate()}
                title={
                  !workshop.certificateEnabled
                    ? "Certificate not yet available"
                    : participantCertificateDownloaded
                      ? "Certificate already downloaded"
                      : "Download your certificate"
                }
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition ${
                  workshop.certificateEnabled &&
                  !participantCertificateDownloaded &&
                  !certLoading
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "cursor-not-allowed bg-primary text-primary-foreground opacity-40"
                }`}
                disabled={
                  !workshop.certificateEnabled ||
                  participantCertificateDownloaded ||
                  certLoading
                }
              >
                {certLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Certificate can be downloaded only once.
              </p>

              {!workshop.certificateEnabled && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  The download button will activate once enabled by the administrator.
                </p>
              )}

              {participantCertificateDownloaded && (
                <p className="mt-2 text-center text-xs font-medium text-green-700">
                  Certificate already downloaded.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
