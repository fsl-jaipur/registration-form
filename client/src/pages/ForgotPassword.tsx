import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword(): JSX.Element {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Email sent", description: data.message || "Check your inbox for reset link." });
        navigate("/login");
      } else {
        toast({ title: "Error", description: data.message || "Unable to send reset email.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[70vh] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-2 text-foreground text-center">Forgot Password</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">Enter your email and we'll send a password reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg px-4 py-2.5 text-white text-sm font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-blue hover:opacity-90"}`}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
