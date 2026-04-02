import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createApiClient } from "@shared/api/client";


type ChangePasswordResponse = {
  message?: string;
};

const ChangePassword = (): JSX.Element => {
  const [email, setEmail] = useState<string>("");
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");

  const handleChangePassword = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (loading) return; // Prevent multiple submissions

    setLoading(true);
    setMessage(""); // Clear previous messages

    try {
      const response = await api.request("/auth/changePassword", {
        method: "POST",
        body: JSON.stringify({
          email,
          password: oldPassword,
          newPassword,
        }),
      });

      const data = (await response.json()) as ChangePasswordResponse;

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Password updated successfully.",
          variant: "default",
        });
        setMessage(data.message ?? "Password updated successfully.");
        setTimeout(() => {
          navigate("/student/studentpanel");
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: data.message ?? "Unable to update password.",
          variant: "destructive",
        });
        setMessage(data.message ?? "Unable to update password.");
      }
    } catch (error) {
      const errorMessage = "An error occurred. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-4 text-foreground text-center">Change Password</h1>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Update your password to continue to your student dashboard.
          </p>

          {message && (
            <div
              className={`mb-4 rounded-lg border p-3 text-sm ${message === "Password updated successfully."
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-red-300 bg-red-50 text-red-700"
                }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="oldPassword">
                Old Password
              </label>
              <div className="relative">
                <input
                  id="oldPassword"
                  type={showOld ? "text" : "password"}
                  className="w-full rounded-lg border border-border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="********"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOld((prev) => !prev)}
                  aria-label={showOld ? "Hide old password" : "Show old password"}
                >
                  {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  className="w-full rounded-lg border border-border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew((prev) => !prev)}
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg px-4 py-2.5 text-white text-sm font-semibold transition ${
                loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-brand-blue hover:opacity-90"
              }`}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
  );
};

export default ChangePassword;
