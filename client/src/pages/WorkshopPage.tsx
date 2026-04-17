import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Award,
  ChevronRight,
  Download,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import {
  checkWorkshopSession,
  downloadCertificate,
  fetchWorkshop,
  sendOtp,
  verifyOtp,
  verifyParticipant,
} from "@/features/workshop/api";
import type { Step, WorkshopData } from "@/features/workshop/types";
import { useToast } from "@/hooks/use-toast";

const OTP_RESEND_COOLDOWN = 60; // seconds

export default function WorkshopPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [workshop, setWorkshop] = useState<WorkshopData | null>(null);
  const [loadingWorkshop, setLoadingWorkshop] = useState(true);
  const [workshopError, setWorkshopError] = useState("");

  const [step, setStep] = useState<Step>("identity");
  const [participantName, setParticipantName] = useState("");

  // Step 1 fields
  const [enrollmentId, setEnrollmentId] = useState("");
  const [email, setEmail] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [identityLoading, setIdentityLoading] = useState(false);

  // Step 2 fields
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3
  const [certLoading, setCertLoading] = useState(false);

  // ─── Load workshop + check for existing session ──────────────────────────
  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const [workshopData, session] = await Promise.all([
          fetchWorkshop(slug),
          checkWorkshopSession(slug).catch(() => ({ authenticated: false })),
        ]);
        setWorkshop(workshopData);

        if (session.authenticated && session.name) {
          setParticipantName(session.name);
          setStep("content");
        }
      } catch {
        setWorkshopError("Workshop not found or unavailable.");
      } finally {
        setLoadingWorkshop(false);
      }
    };

    void load();
  }, [slug]);

  // ─── Cooldown timer for OTP resend ───────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(OTP_RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ─── Step 1: Verify participant ───────────────────────────────────────────
  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityError("");

    if (!enrollmentId.trim() || !email.trim()) {
      setIdentityError("Both fields are required.");
      return;
    }

    setIdentityLoading(true);
    try {
      const result = await verifyParticipant(
        slug!,
        enrollmentId.trim(),
        email.trim(),
      );
      setParticipantName(result.name);

      // Send OTP immediately after verification
      await sendOtp(slug!, enrollmentId.trim(), email.trim());
      startCooldown();

      toast({
        title: "OTP sent!",
        description: `A 6-digit code was sent to ${email.trim()}.`,
      });
      setStep("otp");
    } catch (err) {
      setIdentityError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again.",
      );
    } finally {
      setIdentityLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (!otp.trim() || otp.trim().length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const result = await verifyOtp(slug!, enrollmentId.trim(), otp.trim());
      setParticipantName(result.name);
      setStep("content");
    } catch (err) {
      setOtpError(
        err instanceof Error
          ? err.message
          : "OTP verification failed. Please try again.",
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      await sendOtp(slug!, enrollmentId.trim(), email.trim());
      startCooldown();
      setOtp("");
      setOtpError("");
      toast({
        title: "OTP resent",
        description: `A new code was sent to ${email.trim()}.`,
      });
    } catch (err) {
      toast({
        title: "Could not resend OTP",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ─── Download certificate ─────────────────────────────────────────────────
  const handleDownloadCertificate = async () => {
    setCertLoading(true);
    try {
      await downloadCertificate(slug!);
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

  // ─── Loading / error states ───────────────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Award className="h-6 w-6 text-primary flex-shrink-0" />
          <span className="text-base font-semibold truncate">
            {workshop.title}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* ── Step indicator ── */}
        {step !== "content" && (
          <div className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                step === "identity"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span
              className={
                step === "identity" ? "text-foreground font-medium" : ""
              }
            >
              Verify Identity
            </span>
            <ChevronRight className="h-4 w-4" />
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                step === "otp"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span
              className={step === "otp" ? "text-foreground font-medium" : ""}
            >
              Enter OTP
            </span>
          </div>
        )}

        {/* ── Step 1: Identity form ── */}
        {step === "identity" && (
          <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
            <h1 className="mb-1 text-2xl font-bold">Welcome</h1>
            <p className="mb-8 text-muted-foreground text-sm">
              Enter your enrollment ID and the email address you registered with
              to receive your OTP.
            </p>

            <form
              onSubmit={(e) => void handleIdentitySubmit(e)}
              className="space-y-5"
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium">
                  Enrollment / Registration ID / Scholar No.{" "}
                  <span className="required-field">*</span>
                </span>
                <input
                  type="text"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                  placeholder="e.g. FSL2024001"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  autoComplete="off"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">
                  Email Address <span className="required-field">*</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoComplete="email"
                />
              </label>

              {identityError && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {identityError}
                </p>
              )}

              <button
                type="submit"
                disabled={identityLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {identityLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Send OTP
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: OTP form ── */}
        {step === "otp" && (
          <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mb-1 text-2xl font-bold">Check your inbox</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              We sent a 6-digit code to <strong>{email}</strong>. It expires in
              15 minutes.
            </p>

            <form
              onSubmit={(e) => void handleOtpSubmit(e)}
              className="space-y-5"
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium">One-Time Password</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </label>

              {otpError && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {otpError}
                </p>
              )}

              <button
                type="submit"
                disabled={otpLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep("identity");
                  setOtp("");
                  setOtpError("");
                }}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-primary disabled:text-muted-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Workshop content + certificate ── */}
        {step === "content" && (
          <div className="space-y-8">
            {/* Welcome card */}
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">
                Welcome back,
              </p>
              <h1 className="text-3xl font-bold text-foreground">
                {capitalize(participantName)}
              </h1>
            </div>

            {/* Workshop info card */}
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold">{workshop.title}</h2>
                  {workshop.date && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {workshop.date}
                    </p>
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

            {/* Certificate card */}
            <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Certificate of Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    {workshop.certificateEnabled
                      ? "Your certificate is ready to download."
                      : "Your certificate will be available once the admin enables downloads."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleDownloadCertificate()}
                disabled={!workshop.certificateEnabled || certLoading}
                title={
                  !workshop.certificateEnabled
                    ? "Certificate not yet available"
                    : "Download your certificate"
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {certLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </>
                )}
              </button>

              {!workshop.certificateEnabled && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  The download button will activate once enabled by the
                  administrator.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
