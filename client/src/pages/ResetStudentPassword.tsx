import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

function decodeEmailParam(param: string): string {
  if (!param) return "";
  if (param.includes("@")) return param;
  try {
    const base64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    if (decoded.includes("@")) return decoded;
  } catch {
    // fallback if decoding fails
  }
  return param;
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const [name, domain] = email.split("@");
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

export default function ResetStudentPassword(): JSX.Element {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const rawEmailParam = searchParams.get("e") || searchParams.get("email") || "";
  const [email, setEmail] = useState(() => decodeEmailParam(rawEmailParam));
  const [otp, setOtp] = useState(token);

  useEffect(() => {
    // Clean URL query params immediately so plain/encoded email is stripped from address bar
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!otp) {
      toast({ title: "Error", description: "OTP is required", variant: "destructive" });
      return;
    }

    if (!email) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    if (!newPassword || newPassword !== confirm) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: data.message || "Password reset successful" });
        navigate("/login");
      } else {
        toast({ title: "Error", description: data.message || "Reset failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-foreground text-center">Reset Password</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {email ? `Set a new password for ${maskEmail(email)}` : "Set a new password for your account."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg px-4 py-2.5 text-white text-sm font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-blue hover:opacity-90"}`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
