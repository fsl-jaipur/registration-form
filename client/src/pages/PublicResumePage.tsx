import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import ResumePreview from "@/components/ResumePreview";
import { createApiClient } from "@shared/api/client";
import type { ResumeRecord } from "@/features/resume/types";

export default function PublicResumePage() {
  const api = useMemo(
    () => createApiClient(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ""),
    []
  );
  const { slug = "" } = useParams();
  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.requestJson<ResumeRecord>(`/resumes/share/${slug}`);
        setResume(response);
      } catch (loadError) {
        console.error(loadError);
        setError("This shared resume is unavailable.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading shared resume...
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Shared Resume</h1>
        <p className="mt-4 text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 sm:px-6">
      <ResumePreview resume={resume} />
    </div>
  );
}
