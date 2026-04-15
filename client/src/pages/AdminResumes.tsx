import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileJson, Loader2 } from "lucide-react";
import ResumePreview from "@/components/ResumePreview";
import { createApiClient } from "@shared/api/client";
import type { ResumeRecord, ResumeSummary } from "@/features/resume/types";
import { formatDate, printResume } from "@/features/resume/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminResumes() {
  const api = useMemo(
    () => createApiClient(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ""),
    []
  );
  const { toast } = useToast();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.requestJson<ResumeSummary[]>("/resumes/admin/all");
        setResumes(response);
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load resumes",
          description: "Please refresh the admin page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const openResume = async (resumeId: string) => {
    try {
      const response = await api.requestJson<ResumeRecord>(`/resumes/${resumeId}`);
      setSelectedResume(response);
      setViewOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to open resume",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadJson = async (resumeId: string) => {
    try {
      const response = await api.request(`/resumes/admin/export/${resumeId}`);
      const text = await response.text();
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "resume.json";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({
        title: "JSON download failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Admin / Resumes</p>
          <h1 className="mt-2 text-3xl font-bold">User Resumes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review saved resumes, open them in preview, or export their data for reporting.
          </p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    User Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading resumes...
                      </span>
                    </td>
                  </tr>
                ) : resumes.length ? (
                  resumes.map((resume) => (
                    <tr key={resume._id}>
                      <td className="px-6 py-4 font-medium">{resume.ownerName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {resume.ownerEmail}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(resume.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void openResume(resume._id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            View Resume
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const response = await api.requestJson<ResumeRecord>(`/resumes/${resume._id}`);
                              printResume(response);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => void downloadJson(resume._id)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                          >
                            <FileJson className="h-4 w-4" />
                            Download JSON
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No resumes saved yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto border-0 bg-transparent p-2 shadow-none">
          {selectedResume ? <ResumePreview resume={selectedResume} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
