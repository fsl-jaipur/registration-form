import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2, User, Mail } from "lucide-react";
import { createApiClient } from "@shared/api/client";

type CreateAccountFormProps = {
  onBack: () => void;
};

export default function CreateAccountForm({ onBack }: CreateAccountFormProps) {
  const api = createApiClient(import.meta.env.VITE_API_URL || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.request("/students/quick-register", {
        method: "POST",
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });

      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data?.message ?? "Unable to create account. Please try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-5 py-8 px-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Account Created!</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your login credentials have been sent to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            <br />
            Please check your inbox and use the password provided to log in.
          </p>
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            After logging in, you'll see a <strong>Profile Completion</strong> indicator — complete
            your profile to unlock all student features.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 w-full rounded-lg bg-brand-blue px-4 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        aria-label="Back to login"
      >
        <ArrowLeft size={15} />
        Back to Login
      </button>

      <h2 className="text-2xl font-bold text-foreground mb-1">Create an account</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your name and email to get started. We'll send your login credentials to your email.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="ca-name">
            Full Name
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="ca-name"
              type="text"
              className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="ca-email">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="ca-email"
              type="email"
              className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-blue px-4 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-5 text-xs text-center text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onBack}
          className="text-brand-blue underline hover:opacity-80 transition"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
