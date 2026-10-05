import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApiClient } from "@shared/api/client";
import SignupForm from "@/pages/SignupForm";
import Loader from "@/components/Loader";

type StudentProfileData = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  fname?: string;
  fphone?: string;
  laddress?: string;
  paddress?: string;
  qualification?: string;
  qualificationYear?: string;
  college?: string;
  designation?: string;
  company?: string;
  course?: string;
  referral?: string;
  friendName?: string;
  profileCompletion?: number;
};

/**
 * CompleteProfilePage
 *
 * Fetches the currently logged-in student's profile data and renders the
 * existing Enroll Now / SignupForm in 'complete-profile' mode.
 * Pre-fills name and email; the student fills in the remaining fields.
 * On submit, the existing account is updated (no duplicate created).
 */
export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.requestJson<StudentProfileData>("/students/profile");
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        setFetchError("Failed to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader />;

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center max-w-sm">
          <p className="text-red-700 font-semibold mb-3">{fetchError}</p>
          <button
            onClick={() => navigate("/student/studentpanel")}
            className="rounded-lg bg-brand-blue px-4 py-2 text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Build prefill data from existing profile
  const prefillData = {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    gender: profile?.gender ?? "",
    fatherName: profile?.fname ?? "",
    fatherPhone: profile?.fphone ?? "",
    localAddress: profile?.laddress ?? "",
    permanentAddress: profile?.paddress ?? "",
    qualification: profile?.qualification ?? "",
    qualYear: profile?.qualificationYear ?? "",
    college: profile?.college ?? "",
    designation: profile?.designation ?? "",
    company: profile?.company ?? "",
    course: profile?.course ?? "",
    referral: profile?.referral ?? "",
    friendName: profile?.friendName ?? "",
  };

  return (
    <div>
      {/* Profile Completion Header Banner */}
      {profile?.profileCompletion !== undefined && profile.profileCompletion < 100 && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-center">
          <p className="text-sm text-amber-800 font-medium">
            Your profile is currently{" "}
            <span className="font-bold">{profile.profileCompletion}% complete</span>.
            Fill in the details below to reach 100%.
          </p>
        </div>
      )}
      <SignupForm mode="complete-profile" prefillData={prefillData} />
    </div>
  );
}
