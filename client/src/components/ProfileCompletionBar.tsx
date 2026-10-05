import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { createApiClient } from "@shared/api/client";

type StudentProfile = {
  profileCompletion: number;
  name?: string;
  phone?: string;
  course?: string;
};

/**
 * ProfileCompletionBar
 *
 * Fetches the logged-in student's profile completion percentage from the API
 * and renders a dismissible banner when the profile is not yet 100% complete.
 * Clicking "Complete Profile" navigates to /student/complete-profile.
 */
export default function ProfileCompletionBar() {
  const navigate = useNavigate();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");
  const [completion, setCompletion] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.requestJson<StudentProfile>("/students/profile");
        if (!cancelled) {
          setCompletion(data.profileCompletion ?? 0);
        }
      } catch {
        // silently ignore — don't break the student panel
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || dismissed || completion === null || completion >= 100) return null;

  const isLow = completion < 40;
  const isMid = completion >= 40 && completion < 80;

  const barColor = isLow
    ? "bg-red-500"
    : isMid
    ? "bg-amber-500"
    : "bg-green-500";

  const badgeBg = isLow
    ? "bg-red-100 border-red-300 text-red-800"
    : isMid
    ? "bg-amber-100 border-amber-300 text-amber-800"
    : "bg-green-100 border-green-300 text-green-800";

  return (
    <div
      className={`mx-auto mb-6 rounded-xl border p-4 shadow-sm ${badgeBg} relative`}
      role="alert"
      aria-live="polite"
    >
      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss profile completion notice"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-full p-1 hover:bg-black/10 transition"
      >
        <X size={15} />
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-6">
        <div className="flex items-start gap-3">
          {completion < 100 ? (
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
          )}
          <div>
            <p className="text-sm font-semibold leading-snug">
              Your profile is {completion}% complete
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              Complete your profile to access all student features and enroll in a course.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/student/complete-profile")}
          className="inline-flex items-center gap-1 self-start sm:self-auto rounded-lg border border-current px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition shrink-0"
          id="complete-profile-btn"
        >
          Complete Profile
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-black/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${completion}%` }}
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-1 text-right text-[10px] font-medium opacity-70">
        {completion}% complete
      </p>
    </div>
  );
}
