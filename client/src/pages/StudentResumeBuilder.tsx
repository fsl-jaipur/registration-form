import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  ChevronDown,
  Download,
  FileJson,
  GripVertical,
  Link2,
  Loader2,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAdminContext } from "@/Context/Admincontext";
import LinkedInPromptDialog from "@/components/LinkedInPromptDialog";
import ResumePreview from "@/components/ResumePreview";
import { useToast } from "@/hooks/use-toast";
import { createApiClient } from "@shared/api/client";
import {
  defaultAchievement,
  defaultCertification,
  defaultCustomSection,
  defaultEducation,
  defaultExperience,
  defaultProject,
  defaultResumeValues,
  defaultSocialLink,
  resumeTemplates,
  themeColors,
} from "@/features/resume/defaults";
import type {
  ResumeAchievement,
  ResumeCertification,
  ResumeCustomSection,
  ResumeEducation,
  ResumeExperience,
  ResumeFormValues,
  ResumeProject,
  ResumeRecord,
  ResumeSummary,
  SocialLink,
} from "@/features/resume/types";
import {
  createResumeFilename,
  createResumePdfFilename,
  createResumePayload,
  decodeLinkedInPayload,
  downloadResumeElementPdf,
  downloadResumePdf,
  downloadJsonFile,
  getShareUrl,
  withResumeDefaults,
} from "@/features/resume/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SaveState = "idle" | "saving" | "saved" | "error";

const sectionLabels: Record<string, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
  customSections: "Custom Sections",
};

const initialLinkedInForm = {
  profileUrl: "",
  file: null as File | null,
};
const guestDraftStorageKey = "resume_builder_guest_draft";
const guestResumesStorageKey = "resume_builder_guest_resumes";
const guestActiveIdStorageKey = "resume_builder_guest_active_id";

const arrayMove = <T,>(items: T[], from: number, to: number) => {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

type EditorCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

function EditorCard({ title, action, children }: EditorCardProps) {
  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export default function StudentResumeBuilder() {
  const api = useMemo(
    () => createApiClient(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ""),
    []
  );
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [activeResumeId, setActiveResumeId] = useState("");
  const [draft, setDraft] = useState<ResumeFormValues>(defaultResumeValues());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(false);
  const [showLinkedInImport, setShowLinkedInImport] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInForm, setLinkedInForm] = useState(initialLinkedInForm);
  const [creatingResume, setCreatingResume] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showGuestInfo, setShowGuestInfo] = useState(false);
  const [guestResumes, setGuestResumes] = useState<(ResumeFormValues & { _id: string; updatedAt: string })[]>([]);
  const [guestActiveId, setGuestActiveId] = useState("");
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [editingSocialLinkIndex, setEditingSocialLinkIndex] = useState<number | null>(null);
  const [draggedSocialLinkIndex, setDraggedSocialLinkIndex] = useState<number | null>(null);
  const [dragOverSocialLinkIndex, setDragOverSocialLinkIndex] = useState<number | null>(null);
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null);
  const [draggedSkillIndex, setDraggedSkillIndex] = useState<number | null>(null);
  const [dragOverSkillIndex, setDragOverSkillIndex] = useState<number | null>(null);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
  const [dragOverProjectIndex, setDragOverProjectIndex] = useState<number | null>(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [draggedExperienceIndex, setDraggedExperienceIndex] = useState<number | null>(null);
  const [dragOverExperienceIndex, setDragOverExperienceIndex] = useState<number | null>(null);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [draggedEducationIndex, setDraggedEducationIndex] = useState<number | null>(null);
  const [dragOverEducationIndex, setDragOverEducationIndex] = useState<number | null>(null);
  const [editingCertificationIndex, setEditingCertificationIndex] = useState<number | null>(null);
  const [draggedCertificationIndex, setDraggedCertificationIndex] = useState<number | null>(null);
  const [dragOverCertificationIndex, setDragOverCertificationIndex] = useState<number | null>(null);
  const [editingAchievementIndex, setEditingAchievementIndex] = useState<number | null>(null);
  const [draggedAchievementIndex, setDraggedAchievementIndex] = useState<number | null>(null);
  const [dragOverAchievementIndex, setDragOverAchievementIndex] = useState<number | null>(null);
  const [editingCustomSectionIndex, setEditingCustomSectionIndex] = useState<number | null>(null);
  const [draggedCustomSectionIndex, setDraggedCustomSectionIndex] = useState<number | null>(null);
  const [dragOverCustomSectionIndex, setDragOverCustomSectionIndex] = useState<number | null>(null);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const previewLastTapRef = useRef(0);
  const previewHoldTimerRef = useRef<number | null>(null);
  const previewHoldBaseScaleRef = useRef(previewScale);
  const previewHoldActiveRef = useRef(false);
  const previewDragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const isStudentAuthenticated = authChecked && isAuthenticated && role === "student";

  const activeSummary = resumes.find((item) => item._id === activeResumeId);
  const shareUrl = activeSummary?.shareSlug ? getShareUrl(activeSummary.shareSlug) : "";

  const syncSummary = (
    resume:
      | ResumeRecord
      | (ResumeFormValues & {
          _id: string;
          createdAt?: string;
          updatedAt?: string;
          shareSlug?: string;
        })
  ) => {
    setResumes((current) => {
      const summary: ResumeSummary = {
        _id: resume._id,
        title: resume.title,
        template: resume.template,
        themeMode: resume.themeMode,
        accentColor: resume.accentColor,
        ownerName: "ownerName" in resume ? resume.ownerName || resume.name : resume.name,
        ownerEmail: "ownerEmail" in resume ? resume.ownerEmail || resume.email : resume.email,
        createdAt:
          "createdAt" in resume && resume.createdAt ? resume.createdAt : new Date().toISOString(),
        updatedAt:
          "updatedAt" in resume && resume.updatedAt ? resume.updatedAt : new Date().toISOString(),
        shared: resume.shared,
        shareSlug: "shareSlug" in resume ? resume.shareSlug : undefined,
      };

      const exists = current.some((item) => item._id === summary._id);
      const next = exists
        ? current.map((item) => (item._id === summary._id ? summary : item))
        : [summary, ...current];
      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  const loadResume = async (resumeId: string) => {
    const response = await api.requestJson<ResumeRecord>(`/resumes/${resumeId}`);
    setDraft(withResumeDefaults(response));
    setActiveResumeId(response._id);
    syncSummary(response);
    setInitialLoaded(true);
    setSaveState("idle");
  };

  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;

    try {
      setDownloadingPdf(true);
      const resumePage = previewRef.current?.querySelector<HTMLElement>("[data-resume-page]");
      const filename = createResumePdfFilename({ title: draft.title });

      if (resumePage) {
        await downloadResumeElementPdf(resumePage, filename);
      } else {
        await downloadResumePdf(draft, filename);
      }
    } catch (error) {
      console.error("resume pdf download error", error);
      toast({
        title: "PDF download failed",
        description: "We could not generate the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const updatePreviewScale = (nextScale: number) => {
    setPreviewScale(Math.min(1.4, Math.max(0.5, Number(nextScale.toFixed(2)))));
  };

  const clearPreviewHoldTimer = () => {
    if (previewHoldTimerRef.current !== null) {
      window.clearTimeout(previewHoldTimerRef.current);
      previewHoldTimerRef.current = null;
    }
  };

  const endPreviewHold = () => {
    clearPreviewHoldTimer();
    if (previewHoldActiveRef.current) {
      previewHoldActiveRef.current = false;
      updatePreviewScale(previewHoldBaseScaleRef.current);
    }
  };

  const handlePreviewPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;

    previewDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewPan.x,
      originY: previewPan.y,
    };
    setIsPreviewDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    const now = Date.now();
    const isDoubleTap = now - previewLastTapRef.current < 320;
    previewLastTapRef.current = now;

    if (!isDoubleTap || event.pointerType === "mouse") return;

    event.preventDefault();
    clearPreviewHoldTimer();
    previewHoldBaseScaleRef.current = previewScale;
    previewHoldTimerRef.current = window.setTimeout(() => {
      previewHoldActiveRef.current = true;
      updatePreviewScale(Math.max(previewScale + 0.25, 1));
    }, 120);
  };

  const handlePreviewPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPreviewDragging || previewDragRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - previewDragRef.current.startX;
    const deltaY = event.clientY - previewDragRef.current.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      clearPreviewHoldTimer();
    }

    setPreviewPan({
      x: previewDragRef.current.originX + deltaX,
      y: previewDragRef.current.originY + deltaY,
    });
  };

  const handlePreviewPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (previewDragRef.current.pointerId === event.pointerId) {
      previewDragRef.current.pointerId = -1;
      setIsPreviewDragging(false);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    endPreviewHold();
  };

  useEffect(() => {
    return () => clearPreviewHoldTimer();
  }, []);

  const moveSectionOrder = (fromSection: string, toSection: string) => {
    if (fromSection === toSection) return;

    setDraft((current) => {
      const fromIndex = current.sectionOrder.indexOf(fromSection);
      const toIndex = current.sectionOrder.indexOf(toSection);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      return {
        ...current,
        sectionOrder: arrayMove(current.sectionOrder, fromIndex, toIndex),
      };
    });
  };

  const moveSocialLink = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setDraft((current) => ({
      ...current,
      socialLinks: arrayMove(current.socialLinks, fromIndex, toIndex),
    }));

    if (editingSocialLinkIndex === fromIndex) {
      setEditingSocialLinkIndex(toIndex);
    } else if (editingSocialLinkIndex === toIndex) {
      setEditingSocialLinkIndex(fromIndex);
    }
  };

  const moveSkill = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setDraft((current) => ({
      ...current,
      skills: arrayMove(current.skills, fromIndex, toIndex),
    }));

    if (editingSkillIndex === fromIndex) {
      setEditingSkillIndex(toIndex);
    } else if (editingSkillIndex === toIndex) {
      setEditingSkillIndex(fromIndex);
    }
  };

  const moveProject = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setDraft((current) => ({
      ...current,
      projects: arrayMove(current.projects, fromIndex, toIndex),
    }));

    if (editingProjectIndex === fromIndex) {
      setEditingProjectIndex(toIndex);
    } else if (editingProjectIndex === toIndex) {
      setEditingProjectIndex(fromIndex);
    }
  };

  const moveExperience = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => ({
      ...current,
      experience: arrayMove(current.experience, fromIndex, toIndex),
    }));
    if (editingExperienceIndex === fromIndex) setEditingExperienceIndex(toIndex);
    else if (editingExperienceIndex === toIndex) setEditingExperienceIndex(fromIndex);
  };

  const moveEducation = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => ({
      ...current,
      education: arrayMove(current.education, fromIndex, toIndex),
    }));
    if (editingEducationIndex === fromIndex) setEditingEducationIndex(toIndex);
    else if (editingEducationIndex === toIndex) setEditingEducationIndex(fromIndex);
  };

  const moveCertification = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => ({
      ...current,
      certifications: arrayMove(current.certifications, fromIndex, toIndex),
    }));
    if (editingCertificationIndex === fromIndex) setEditingCertificationIndex(toIndex);
    else if (editingCertificationIndex === toIndex) setEditingCertificationIndex(fromIndex);
  };

  const moveAchievement = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => ({
      ...current,
      achievements: arrayMove(current.achievements, fromIndex, toIndex),
    }));
    if (editingAchievementIndex === fromIndex) setEditingAchievementIndex(toIndex);
    else if (editingAchievementIndex === toIndex) setEditingAchievementIndex(fromIndex);
  };

  const moveCustomSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((current) => ({
      ...current,
      customSections: arrayMove(current.customSections, fromIndex, toIndex),
    }));
    if (editingCustomSectionIndex === fromIndex) setEditingCustomSectionIndex(toIndex);
    else if (editingCustomSectionIndex === toIndex) setEditingCustomSectionIndex(fromIndex);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!authChecked) {
        return;
      }

      if (!isStudentAuthenticated) {
        const storedRaw = localStorage.getItem(guestResumesStorageKey);
        let loaded: (ResumeFormValues & { _id: string; updatedAt: string })[] = [];
        if (storedRaw) {
          try { loaded = JSON.parse(storedRaw); } catch { /* ignore */ }
        }
        if (!loaded.length) {
          const oldDraft = localStorage.getItem(guestDraftStorageKey);
          if (oldDraft) {
            try {
              const parsed = JSON.parse(oldDraft) as ResumeFormValues;
              loaded = [{ ...withResumeDefaults(parsed), _id: crypto.randomUUID(), updatedAt: new Date().toISOString() }];
            } catch { /* ignore */ }
          }
        }
        if (!loaded.length) {
          loaded = [{ ...defaultResumeValues(), _id: crypto.randomUUID(), updatedAt: new Date().toISOString() }];
        }
        const storedActiveId = localStorage.getItem(guestActiveIdStorageKey) ?? "";
        const active = loaded.find((r) => r._id === storedActiveId) ?? loaded[0];
        setGuestResumes(loaded);
        setGuestActiveId(active._id);
        setDraft(withResumeDefaults(active));

        const hasSeenPrompt = sessionStorage.getItem("resume-linkedin-prompt-seen");
        if (!hasSeenPrompt) {
          setShowLinkedInPrompt(true);
          sessionStorage.setItem("resume-linkedin-prompt-seen", "true");
        }

        setInitialLoaded(true);
        setBootstrapping(false);
        return;
      }

      try {
        setBootstrapping(true);
        const response = await api.requestJson<{
          student: { name: string; email: string; phone?: string };
          resumes: ResumeSummary[];
          defaultResume: ResumeFormValues;
        }>("/resumes/bootstrap");

        setResumes(response.resumes);
        if (response.resumes.length > 0) {
          await loadResume(response.resumes[0]._id);
        } else {
          setDraft(
            withResumeDefaults({
              ...response.defaultResume,
              name: response.student.name || response.defaultResume.name,
              email: response.student.email || response.defaultResume.email,
              phone: response.student.phone || response.defaultResume.phone,
            })
          );
          setInitialLoaded(true);
        }

        const hasSeenPrompt = sessionStorage.getItem("resume-linkedin-prompt-seen");
        if (!hasSeenPrompt) {
          setShowLinkedInPrompt(true);
          sessionStorage.setItem("resume-linkedin-prompt-seen", "true");
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load resume workspace",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setBootstrapping(false);
      }
    };

    void bootstrap();
  }, [authChecked, isStudentAuthenticated]);

  useEffect(() => {
    const status = searchParams.get("linkedin");
    const payload = searchParams.get("payload");
    const message = searchParams.get("message");

    if (!status) return;

    if (status === "success" && payload) {
      const decoded = decodeLinkedInPayload(payload);
      if (decoded && typeof decoded === "object") {
        setDraft((current) =>
          withResumeDefaults({
            ...current,
            name: typeof decoded.name === "string" ? decoded.name : current.name,
            email: typeof decoded.email === "string" ? decoded.email : current.email,
            profilePhoto:
              typeof decoded.profilePhoto === "string"
                ? decoded.profilePhoto
                : current.profilePhoto,
            linkedInImport:
              decoded.linkedInImport && typeof decoded.linkedInImport === "object"
                ? {
                    profileUrl:
                      typeof decoded.linkedInImport.profileUrl === "string"
                        ? decoded.linkedInImport.profileUrl
                        : current.linkedInImport.profileUrl,
                    importSource:
                      typeof decoded.linkedInImport.importSource === "string"
                        ? decoded.linkedInImport.importSource
                        : "linkedin-oauth",
                    lastImportedAt: new Date().toISOString(),
                  }
                : current.linkedInImport,
          })
        );
        toast({
          title: "LinkedIn import ready",
          description: "Basic profile data has been added to your draft.",
        });
      }
    } else if (status === "error") {
      toast({
        title: "LinkedIn import failed",
        description: message || "Please try the PDF option instead.",
        variant: "destructive",
      });
    }

    setSearchParams({});
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (!authChecked || isStudentAuthenticated || !initialLoaded || !guestActiveId) return;

    const payload = { ...createResumePayload(draft), _id: guestActiveId, updatedAt: new Date().toISOString() } as ResumeFormValues & { _id: string; updatedAt: string };
    setGuestResumes((current) => {
      const updated = current.some((r) => r._id === guestActiveId)
        ? current.map((r) => (r._id === guestActiveId ? payload : r))
        : current;
      localStorage.setItem(guestResumesStorageKey, JSON.stringify(updated));
      localStorage.setItem(guestActiveIdStorageKey, guestActiveId);
      return updated;
    });
    setSaveState("saved");
  }, [authChecked, isStudentAuthenticated, initialLoaded, draft, guestActiveId]);

  useEffect(() => {
    if (!initialLoaded || !activeResumeId) return;
    if (!isStudentAuthenticated) return;

    const timeout = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        const response = await api.requestJson<ResumeRecord>(`/resumes/${activeResumeId}`, {
          method: "PUT",
          body: JSON.stringify(createResumePayload(draft)),
        });
        setSaveState("saved");
        syncSummary(response);
      } catch (error) {
        console.error(error);
        setSaveState("error");
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [draft, activeResumeId, initialLoaded, isStudentAuthenticated]);

  const handleManualSave = async () => {
    if (!isStudentAuthenticated) {
      // Guest: auto-save already handles it via the effect; just notify
      setSaveState("saved");
      toast({
        title: "Draft saved locally",
        description: "Your resume is stored in this browser without login.",
      });
      return;
    }

    if (!activeResumeId) return;
    try {
      setSaveState("saving");
      const response = await api.requestJson<ResumeRecord>(`/resumes/${activeResumeId}`, {
        method: "PUT",
        body: JSON.stringify(createResumePayload(draft)),
      });
      syncSummary(response);
      setSaveState("saved");
      toast({
        title: "Resume saved",
        description: "Your latest edits are stored in MongoDB.",
      });
    } catch (error) {
      console.error(error);
      setSaveState("error");
      toast({
        title: "Save failed",
        description: "We could not save your changes.",
        variant: "destructive",
      });
    }
  };

  const createNewResume = async () => {
    if (!isStudentAuthenticated) {
      const newId = crypto.randomUUID();
      const blank = { ...defaultResumeValues(), _id: newId, updatedAt: new Date().toISOString() };
      setGuestResumes((current) => {
        const updated = [...current, blank];
        localStorage.setItem(guestResumesStorageKey, JSON.stringify(updated));
        return updated;
      });
      setGuestActiveId(newId);
      localStorage.setItem(guestActiveIdStorageKey, newId);
      setDraft(defaultResumeValues());
      setSaveState("idle");
      toast({
        title: "New resume started",
        description: "Your previous resume is saved and still accessible on the right.",
      });
      return;
    }

    try {
      setCreatingResume(true);
      const response = await api.requestJson<ResumeRecord>("/resumes", {
        method: "POST",
        body: JSON.stringify(createResumePayload(draft)),
      });
      setActiveResumeId(response._id);
      setDraft(withResumeDefaults(response));
      syncSummary(response);
      setInitialLoaded(true);
      setSaveState("saved");
      toast({
        title: "Resume created",
        description: "Your new resume draft is ready to edit.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Could not create resume",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingResume(false);
    }
  };

  const deleteResume = async () => {
    const resumeNameForDelete = draft.title || draft.name || "Untitled Resume";

    if (!isStudentAuthenticated) {
      if (!window.confirm(`Delete "${resumeNameForDelete}"?`)) return;
      setGuestResumes((current) => {
        const filtered = current.filter((r) => r._id !== guestActiveId);
        const next = filtered.length
          ? filtered
          : [{ ...defaultResumeValues(), _id: crypto.randomUUID(), updatedAt: new Date().toISOString() }];
        localStorage.setItem(guestResumesStorageKey, JSON.stringify(next));
        localStorage.setItem(guestActiveIdStorageKey, next[0]._id);
        setGuestActiveId(next[0]._id);
        setDraft(withResumeDefaults(next[0]));
        return next;
      });
      setSaveState("idle");
      toast({ title: "Resume deleted", description: "The draft has been removed." });
      return;
    }

    if (!activeResumeId) return;
    if (!window.confirm(`Delete "${resumeNameForDelete}"?`)) return;

    try {
      await api.request(`/resumes/${activeResumeId}`, {
        method: "DELETE",
      });

      const nextResumes = resumes.filter((item) => item._id !== activeResumeId);
      setResumes(nextResumes);
      if (nextResumes[0]) {
        await loadResume(nextResumes[0]._id);
      } else {
        setActiveResumeId("");
        setDraft(defaultResumeValues());
      }
      toast({
        title: "Resume deleted",
        description: "The draft has been removed.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Delete failed",
        description: "We could not delete this resume.",
        variant: "destructive",
      });
    }
  };

  const startLinkedInOAuth = async () => {
    try {
      setLinkedInLoading(true);
      const response = await api.requestJson<{ url: string }>("/resumes/linkedin/auth-url");
      window.location.href = response.url;
    } catch (error) {
      console.error(error);
      toast({
        title: "LinkedIn OAuth unavailable",
        description: "Set the LinkedIn env vars or use PDF import.",
        variant: "destructive",
      });
    } finally {
      setLinkedInLoading(false);
    }
  };

  const importLinkedInPdf = async () => {
    if (!linkedInForm.file) {
      toast({
        title: "Upload a PDF first",
        description: "Choose your LinkedIn exported PDF to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLinkedInLoading(true);
      const formData = new FormData();
      formData.append("file", linkedInForm.file);
      formData.append("profileUrl", linkedInForm.profileUrl);
      const response = await api.request("/resumes/linkedin/pdf-import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as {
        data: Partial<ResumeFormValues>;
      };

      setDraft((current) =>
        withResumeDefaults({
          ...current,
          ...payload.data,
          skills: payload.data.skills?.length ? payload.data.skills : current.skills,
          experience:
            payload.data.experience?.length ? payload.data.experience : current.experience,
          education:
            payload.data.education?.length ? payload.data.education : current.education,
          certifications:
            payload.data.certifications?.length
              ? payload.data.certifications
              : current.certifications,
          achievements:
            payload.data.achievements?.length
              ? payload.data.achievements
              : current.achievements,
        })
      );
      setShowLinkedInImport(false);
      setLinkedInForm(initialLinkedInForm);
      toast({
        title: "LinkedIn PDF imported",
        description: "Structured fields were added to your resume draft.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "PDF import failed",
        description: "Please verify the file and try again.",
        variant: "destructive",
      });
    } finally {
      setLinkedInLoading(false);
    }
  };

  const loadGuestResume = (id: string) => {
    const resume = guestResumes.find((r) => r._id === id);
    if (!resume) return;
    setDraft(withResumeDefaults(resume));
    setGuestActiveId(id);
    localStorage.setItem(guestActiveIdStorageKey, id);
  };

  const updateListField = <T,>(
    items: T[],
    index: number,
    updater: (current: T) => T
  ) => {
    const next = [...items];
    next[index] = updater(next[index]);
    return next;
  };

  const saveStatusLabel = {
    idle: "Draft ready",
    saving: "Auto-saving...",
    saved: "All changes saved",
    error: "Save error",
  }[saveState];

  if (bootstrapping) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading resume workspace...
        </div>
      </div>
    );
  }

  return (
    <div className={draft.themeMode === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.18),_transparent_30%),linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)] text-foreground">
        <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-[32px] border border-border bg-card/80 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Student / Resume Builder</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Modern Resume Studio
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                  Build, preview, save, and export production-ready resumes with
                  multiple templates, LinkedIn-assisted import, and admin review support.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowLinkedInImport(true)}
                  className="rounded-2xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  Import from LinkedIn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeResumeId) {
                      void createNewResume();
                      return;
                    }
                    void handleManualSave();
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                >
                  <Save className="h-4 w-4" />
                  {isStudentAuthenticated
                    ? activeResumeId
                      ? "Save now"
                      : "Create first resume"
                    : "Save local draft"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isStudentAuthenticated ? (
                <div className="rounded-full border border-border bg-background px-4 py-2 text-sm">
                  {saveStatusLabel}
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGuestInfo((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
                  >
                    Guest mode
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {showGuestInfo ? (
                    <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-lg">
                      <p className="text-sm font-semibold">Guest Draft</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Build directly without login. This draft stays in your browser. Sign in later if you want MongoDB autosave and multi-resume management.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
              {shareUrl ? (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Copy share link
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadJsonFile(
                    createResumeFilename({ title: draft.title }),
                    createResumePayload(draft)
                  )
                }
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
              >
                <FileJson className="h-4 w-4" />
                Download JSON
              </button>
              {(activeResumeId || (!isStudentAuthenticated && guestActiveId)) ? (
                <button
                  type="button"
                  onClick={() => void deleteResume()}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void createNewResume()}
                disabled={creatingResume}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
              >
                {creatingResume ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                New resume
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
                  >
                    My resume
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto rounded-2xl">
                  {isStudentAuthenticated ? (
                    resumes.length ? (
                      resumes.map((resume) => (
                        <DropdownMenuItem
                          key={resume._id}
                          onClick={() => void loadResume(resume._id)}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 ${
                            resume._id === activeResumeId
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-transparent"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{resume.title}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {resume.template} template
                            </p>
                          </div>
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: resume.accentColor }}
                          />
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground">
                        No saved resumes yet.
                      </div>
                    )
                  ) : guestResumes.length ? (
                    guestResumes.map((resume) => (
                      <DropdownMenuItem
                        key={resume._id}
                        onClick={() => loadGuestResume(resume._id)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 ${
                          resume._id === guestActiveId
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-transparent"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {resume.title || "Untitled Resume"}
                          </p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {resume.template} template
                          </p>
                        </div>
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: resume.accentColor }}
                        />
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      No local resumes yet.
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>

          <section className="grid gap-4 items-start lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="resume-editor-scroll max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto pr-2 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]">
                <EditorCard title="Essentials">
                  <TextInput
                    label="Resume Title"
                    value={draft.title}
                    onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
                    placeholder="Senior Product Designer Resume"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      label="Full Name"
                      value={draft.name}
                      onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                    />
                    <TextInput
                      label="Phone"
                      value={draft.phone}
                      onChange={(value) => setDraft((current) => ({ ...current, phone: value }))}
                    />
                  </div>
                  <TextInput
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(value) => setDraft((current) => ({ ...current, email: value }))}
                  />
                  <TextArea
                    label="Summary / About"
                    value={draft.summary}
                    onChange={(value) => setDraft((current) => ({ ...current, summary: value }))}
                    rows={5}
                  />
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Profile Photo</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium">
                        <Upload className="h-4 w-4" />
                        Upload image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const photo = await toDataUrl(file);
                            setDraft((current) => ({ ...current, profilePhoto: photo }));
                          }}
                        />
                      </label>
                      {draft.profilePhoto ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((current) => ({ ...current, profilePhoto: "" }))
                          }
                          className="rounded-2xl border border-border px-4 py-3 text-sm font-medium"
                        >
                          Remove photo
                        </button>
                      ) : null}
                    </div>
                  </label>
                </EditorCard>

                <EditorCard title="Templates and Theme">
                  <div className="flex flex-wrap gap-3">
                    {resumeTemplates.map((template) => (
                      <button
                        type="button"
                        key={template.id}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            template: template.id,
                          }))
                        }
                        className={`rounded-3xl border p-4 text-left transition ${
                          draft.template === template.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        } min-w-[180px] flex-1`}
                      >
                        <p className="font-semibold">{template.label}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium">Theme mode</p>
                      <div className="flex flex-wrap gap-3">
                        {(["light", "dark"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setDraft((current) => ({ ...current, themeMode: mode }))
                            }
                            className={`rounded-2xl border px-4 py-3 text-sm font-semibold capitalize ${
                              draft.themeMode === mode
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Accent color</p>
                      <div className="flex flex-wrap items-center gap-3">
                        {themeColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() =>
                              setDraft((current) => ({ ...current, accentColor: color }))
                            }
                            className={`h-10 w-10 rounded-full border-2 ${
                              draft.accentColor === color ? "border-foreground" : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.shared}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shared: event.target.checked,
                        }))
                      }
                    />
                    Enable shareable link
                  </label>
                </EditorCard>

                <EditorCard
                  title="Section Order"
                  action={<span className="text-xs text-muted-foreground">Drag to reorder</span>}
                >
                  <div className="space-y-2">
                    {draft.sectionOrder.map((section, index) => (
                      <div
                        key={section}
                        draggable
                        onDragStart={(event) => {
                          setDraggedSection(section);
                          setDragOverSection(section);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", section);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          if (dragOverSection !== section) {
                            setDragOverSection(section);
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const sourceSection =
                            draggedSection || event.dataTransfer.getData("text/plain");

                          if (sourceSection) {
                            moveSectionOrder(sourceSection, section);
                          }

                          setDraggedSection(null);
                          setDragOverSection(null);
                        }}
                        onDragEnd={() => {
                          setDraggedSection(null);
                          setDragOverSection(null);
                        }}
                        className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                          draggedSection === section
                            ? "border-primary bg-primary/5 opacity-70"
                            : dragOverSection === section
                              ? "border-primary/70 bg-primary/5"
                              : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium">
                            {sectionLabels[section] || section}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Profiles"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          socialLinks: [...current.socialLinks, defaultSocialLink()],
                        }));
                        setEditingSocialLinkIndex(draft.socialLinks.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.socialLinks.map((link, index) => (
                      <div key={`social-link-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedSocialLinkIndex(index);
                            setDragOverSocialLinkIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverSocialLinkIndex !== index) {
                              setDragOverSocialLinkIndex(index);
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex = draggedSocialLinkIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) {
                              moveSocialLink(sourceIndex, index);
                            }
                            setDraggedSocialLinkIndex(null);
                            setDragOverSocialLinkIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedSocialLinkIndex(null);
                            setDragOverSocialLinkIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedSocialLinkIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverSocialLinkIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {link.label || "Untitled profile"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {link.url || "Add profile URL"}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingSocialLinkIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDraft((current) => ({
                                    ...current,
                                    socialLinks: current.socialLinks.filter((_, itemIndex) => itemIndex !== index),
                                  }));
                                  setEditingSocialLinkIndex((current) => {
                                    if (current === null) return null;
                                    if (current === index) return null;
                                    return current > index ? current - 1 : current;
                                  });
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {editingSocialLinkIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <TextInput
                                label="Label"
                                value={link.label}
                                onChange={(value) =>
                                  setDraft((current) => ({
                                    ...current,
                                    socialLinks: updateListField<SocialLink>(
                                      current.socialLinks,
                                      index,
                                      (item) => ({ ...item, label: value })
                                    ),
                                  }))
                                }
                              />
                              <TextInput
                                label="URL"
                                value={link.url}
                                onChange={(value) =>
                                  setDraft((current) => ({
                                    ...current,
                                    socialLinks: updateListField<SocialLink>(
                                      current.socialLinks,
                                      index,
                                      (item) => ({ ...item, url: value })
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingSocialLinkIndex(null)}
                                className="rounded-2xl border border-border px-4 py-2 text-sm font-medium"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Skills"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          skills: [...current.skills, ""],
                        }));
                        setEditingSkillIndex(draft.skills.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.skills.map((skill, index) => (
                      <div key={`skill-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedSkillIndex(index);
                            setDragOverSkillIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverSkillIndex !== index) {
                              setDragOverSkillIndex(index);
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex =
                              draggedSkillIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) {
                              moveSkill(sourceIndex, index);
                            }
                            setDraggedSkillIndex(null);
                            setDragOverSkillIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedSkillIndex(null);
                            setDragOverSkillIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedSkillIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverSkillIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <p className="truncate text-sm font-semibold">
                              {skill || "Untitled skill"}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingSkillIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDraft((current) => ({
                                    ...current,
                                    skills: current.skills.filter((_, itemIndex) => itemIndex !== index),
                                  }));
                                  setEditingSkillIndex((current) => {
                                    if (current === null) return null;
                                    if (current === index) return null;
                                    return current > index ? current - 1 : current;
                                  });
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {editingSkillIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <TextInput
                              label="Skill"
                              value={skill}
                              onChange={(value) =>
                                setDraft((current) => ({
                                  ...current,
                                  skills: updateListField<string>(
                                    current.skills,
                                    index,
                                    () => value
                                  ),
                                }))
                              }
                              placeholder="React, Figma, Node.js"
                            />
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingSkillIndex(null)}
                                className="rounded-2xl border border-border px-4 py-2 text-sm font-medium"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Projects"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          projects: [...current.projects, defaultProject()],
                        }));
                        setEditingProjectIndex(draft.projects.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new project
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.projects.map((project, index) => (
                      <div key={`project-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedProjectIndex(index);
                            setDragOverProjectIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverProjectIndex !== index) {
                              setDragOverProjectIndex(index);
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex =
                              draggedProjectIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) {
                              moveProject(sourceIndex, index);
                            }
                            setDraggedProjectIndex(null);
                            setDragOverProjectIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedProjectIndex(null);
                            setDragOverProjectIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedProjectIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverProjectIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {project.title || "Untitled project"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {project.linkUrl || project.description || "Add project details"}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingProjectIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDraft((current) => ({
                                    ...current,
                                    projects: current.projects.filter((_, itemIndex) => itemIndex !== index),
                                  }));
                                  setEditingProjectIndex((current) => {
                                    if (current === null) return null;
                                    if (current === index) return null;
                                    return current > index ? current - 1 : current;
                                  });
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {editingProjectIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <TextInput
                              label="Project title"
                              value={project.title}
                              onChange={(value) =>
                                setDraft((current) => ({
                                  ...current,
                                  projects: updateListField<ResumeProject>(
                                    current.projects,
                                    index,
                                    (item) => ({ ...item, title: value })
                                  ),
                                }))
                              }
                            />
                            <TextArea
                              label="Description"
                              value={project.description}
                              onChange={(value) =>
                                setDraft((current) => ({
                                  ...current,
                                  projects: updateListField<ResumeProject>(
                                    current.projects,
                                    index,
                                    (item) => ({ ...item, description: value })
                                  ),
                                }))
                              }
                            />
                            <div className="grid gap-4 md:grid-cols-2">
                              <TextInput
                                label="Link label"
                                value={project.linkLabel}
                                onChange={(value) =>
                                  setDraft((current) => ({
                                    ...current,
                                    projects: updateListField<ResumeProject>(
                                      current.projects,
                                      index,
                                      (item) => ({ ...item, linkLabel: value })
                                    ),
                                  }))
                                }
                              />
                              <TextInput
                                label="Link URL"
                                value={project.linkUrl}
                                onChange={(value) =>
                                  setDraft((current) => ({
                                    ...current,
                                    projects: updateListField<ResumeProject>(
                                      current.projects,
                                      index,
                                      (item) => ({ ...item, linkUrl: value })
                                    ),
                                  }))
                                }
                              />
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingProjectIndex(null)}
                                className="rounded-2xl border border-border px-4 py-2 text-sm font-medium"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Experience"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          experience: [...current.experience, defaultExperience()],
                        }));
                        setEditingExperienceIndex(draft.experience.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new experience
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.experience.map((experience, index) => (
                      <div key={`experience-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedExperienceIndex(index);
                            setDragOverExperienceIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverExperienceIndex !== index) setDragOverExperienceIndex(index);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex = draggedExperienceIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) moveExperience(sourceIndex, index);
                            setDraggedExperienceIndex(null);
                            setDragOverExperienceIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedExperienceIndex(null);
                            setDragOverExperienceIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedExperienceIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverExperienceIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{experience.role || "Untitled experience"}</p>
                              <p className="truncate text-xs text-muted-foreground">{[experience.company, experience.duration].filter(Boolean).join(" • ") || "Add experience details"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingExperienceIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setDraft((current) => ({ ...current, experience: current.experience.filter((_, itemIndex) => itemIndex !== index) }));
                                setEditingExperienceIndex((current) => current === null ? null : current === index ? null : current > index ? current - 1 : current);
                              }} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {editingExperienceIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <TextInput label="Company" value={experience.company} onChange={(value) => setDraft((current) => ({ ...current, experience: updateListField<ResumeExperience>(current.experience, index, (item) => ({ ...item, company: value })) }))} />
                              <TextInput label="Role" value={experience.role} onChange={(value) => setDraft((current) => ({ ...current, experience: updateListField<ResumeExperience>(current.experience, index, (item) => ({ ...item, role: value })) }))} />
                              <TextInput label="Duration" value={experience.duration} onChange={(value) => setDraft((current) => ({ ...current, experience: updateListField<ResumeExperience>(current.experience, index, (item) => ({ ...item, duration: value })) }))} />
                            </div>
                            <TextArea label="Description" value={experience.description} onChange={(value) => setDraft((current) => ({ ...current, experience: updateListField<ResumeExperience>(current.experience, index, (item) => ({ ...item, description: value })) }))} />
                            <div className="mt-3 flex justify-end">
                              <button type="button" onClick={() => setEditingExperienceIndex(null)} className="rounded-2xl border border-border px-4 py-2 text-sm font-medium">Done</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Education"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          education: [...current.education, defaultEducation()],
                        }));
                        setEditingEducationIndex(draft.education.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new education
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.education.map((education, index) => (
                      <div key={`education-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedEducationIndex(index);
                            setDragOverEducationIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverEducationIndex !== index) setDragOverEducationIndex(index);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex = draggedEducationIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) moveEducation(sourceIndex, index);
                            setDraggedEducationIndex(null);
                            setDragOverEducationIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedEducationIndex(null);
                            setDragOverEducationIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedEducationIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverEducationIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{education.degree || "Untitled education"}</p>
                              <p className="truncate text-xs text-muted-foreground">{[education.college, education.year].filter(Boolean).join(" • ") || "Add education details"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingEducationIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setDraft((current) => ({ ...current, education: current.education.filter((_, itemIndex) => itemIndex !== index) }));
                                setEditingEducationIndex((current) => current === null ? null : current === index ? null : current > index ? current - 1 : current);
                              }} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {editingEducationIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <div className="grid gap-4 md:grid-cols-3">
                              <TextInput label="Degree" value={education.degree} onChange={(value) => setDraft((current) => ({ ...current, education: updateListField<ResumeEducation>(current.education, index, (item) => ({ ...item, degree: value })) }))} />
                              <TextInput label="College" value={education.college} onChange={(value) => setDraft((current) => ({ ...current, education: updateListField<ResumeEducation>(current.education, index, (item) => ({ ...item, college: value })) }))} />
                              <TextInput label="Year" value={education.year} onChange={(value) => setDraft((current) => ({ ...current, education: updateListField<ResumeEducation>(current.education, index, (item) => ({ ...item, year: value })) }))} />
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button type="button" onClick={() => setEditingEducationIndex(null)} className="rounded-2xl border border-border px-4 py-2 text-sm font-medium">Done</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Certifications"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          certifications: [...current.certifications, defaultCertification()],
                        }));
                        setEditingCertificationIndex(draft.certifications.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new certification
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.certifications.map((certification, index) => (
                      <div key={`certification-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedCertificationIndex(index);
                            setDragOverCertificationIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverCertificationIndex !== index) setDragOverCertificationIndex(index);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex = draggedCertificationIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) moveCertification(sourceIndex, index);
                            setDraggedCertificationIndex(null);
                            setDragOverCertificationIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedCertificationIndex(null);
                            setDragOverCertificationIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedCertificationIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverCertificationIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{certification.title || "Untitled certification"}</p>
                              <p className="truncate text-xs text-muted-foreground">{[certification.issuer, certification.year].filter(Boolean).join(" • ") || "Add certification details"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingCertificationIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setDraft((current) => ({ ...current, certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index) }));
                                setEditingCertificationIndex((current) => current === null ? null : current === index ? null : current > index ? current - 1 : current);
                              }} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {editingCertificationIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <TextInput label="Title" value={certification.title} onChange={(value) => setDraft((current) => ({ ...current, certifications: updateListField<ResumeCertification>(current.certifications, index, (item) => ({ ...item, title: value })) }))} />
                              <TextInput label="Issuer" value={certification.issuer} onChange={(value) => setDraft((current) => ({ ...current, certifications: updateListField<ResumeCertification>(current.certifications, index, (item) => ({ ...item, issuer: value })) }))} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <TextInput label="Year" value={certification.year} onChange={(value) => setDraft((current) => ({ ...current, certifications: updateListField<ResumeCertification>(current.certifications, index, (item) => ({ ...item, year: value })) }))} />
                              <TextInput label="Credential URL" value={certification.credentialUrl} onChange={(value) => setDraft((current) => ({ ...current, certifications: updateListField<ResumeCertification>(current.certifications, index, (item) => ({ ...item, credentialUrl: value })) }))} />
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button type="button" onClick={() => setEditingCertificationIndex(null)} className="rounded-2xl border border-border px-4 py-2 text-sm font-medium">Done</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Achievements"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          achievements: [...current.achievements, defaultAchievement()],
                        }));
                        setEditingAchievementIndex(draft.achievements.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new achievement
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.achievements.map((achievement, index) => (
                      <div key={`achievement-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedAchievementIndex(index);
                            setDragOverAchievementIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverAchievementIndex !== index) setDragOverAchievementIndex(index);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex = draggedAchievementIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) moveAchievement(sourceIndex, index);
                            setDraggedAchievementIndex(null);
                            setDragOverAchievementIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedAchievementIndex(null);
                            setDragOverAchievementIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedAchievementIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverAchievementIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{achievement.title || "Untitled achievement"}</p>
                              <p className="truncate text-xs text-muted-foreground">{achievement.description || "Add achievement details"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingAchievementIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setDraft((current) => ({ ...current, achievements: current.achievements.filter((_, itemIndex) => itemIndex !== index) }));
                                setEditingAchievementIndex((current) => current === null ? null : current === index ? null : current > index ? current - 1 : current);
                              }} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {editingAchievementIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <TextInput label="Title" value={achievement.title} onChange={(value) => setDraft((current) => ({ ...current, achievements: updateListField<ResumeAchievement>(current.achievements, index, (item) => ({ ...item, title: value })) }))} />
                            <TextArea label="Description" value={achievement.description} onChange={(value) => setDraft((current) => ({ ...current, achievements: updateListField<ResumeAchievement>(current.achievements, index, (item) => ({ ...item, description: value })) }))} />
                            <div className="mt-3 flex justify-end">
                              <button type="button" onClick={() => setEditingAchievementIndex(null)} className="rounded-2xl border border-border px-4 py-2 text-sm font-medium">Done</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>

                <EditorCard
                  title="Custom Sections"
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          customSections: [...current.customSections, defaultCustomSection()],
                        }));
                        setEditingCustomSectionIndex(draft.customSections.length);
                      }}
                      className="rounded-2xl border border-border px-3 py-2 text-sm font-medium"
                    >
                      Add new custom section
                    </button>
                  }
                >
                  <div className="space-y-2">
                    {draft.customSections.map((section, index) => (
                      <div key={`custom-section-${index}`}>
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggedCustomSectionIndex(index);
                            setDragOverCustomSectionIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (dragOverCustomSectionIndex !== index) setDragOverCustomSectionIndex(index);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            const sourceIndex = draggedCustomSectionIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (Number.isInteger(sourceIndex)) moveCustomSection(sourceIndex, index);
                            setDraggedCustomSectionIndex(null);
                            setDragOverCustomSectionIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedCustomSectionIndex(null);
                            setDragOverCustomSectionIndex(null);
                          }}
                          className={`flex items-center justify-between rounded-2xl border bg-background px-4 py-3 transition ${
                            draggedCustomSectionIndex === index
                              ? "border-primary bg-primary/5 opacity-70"
                              : dragOverCustomSectionIndex === index
                                ? "border-primary/70 bg-primary/5"
                                : "border-border"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="cursor-grab text-muted-foreground active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{section.title || "Untitled section"}</p>
                              <p className="truncate text-xs text-muted-foreground">{section.items.join(", ") || "Add section items"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem onClick={() => setEditingCustomSectionIndex(index)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setDraft((current) => ({ ...current, customSections: current.customSections.filter((_, itemIndex) => itemIndex !== index) }));
                                setEditingCustomSectionIndex((current) => current === null ? null : current === index ? null : current > index ? current - 1 : current);
                              }} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {editingCustomSectionIndex === index ? (
                          <div className="mt-2 rounded-3xl border border-border bg-background/60 p-4">
                            <TextInput label="Section title" value={section.title} onChange={(value) => setDraft((current) => ({ ...current, customSections: updateListField<ResumeCustomSection>(current.customSections, index, (item) => ({ ...item, title: value })) }))} />
                            <TextArea label="Items" value={section.items.join("\n")} onChange={(value) => setDraft((current) => ({ ...current, customSections: updateListField<ResumeCustomSection>(current.customSections, index, (item) => ({ ...item, items: value.split("\n").map((line) => line.trim()).filter(Boolean) })) }))} rows={4} />
                            <div className="mt-3 flex justify-end">
                              <button type="button" onClick={() => setEditingCustomSectionIndex(null)} className="rounded-2xl border border-border px-4 py-2 text-sm font-medium">Done</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </EditorCard>
            </div>

            <div className="sticky top-8">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Live Preview</h2>
                    <p className="text-sm text-muted-foreground">
                      Printable multi-section preview
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updatePreviewScale(previewScale - 0.1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Zoom out"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updatePreviewScale(0.8);
                          setPreviewPan({ x: 0, y: 0 });
                        }}
                        className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        {Math.round(previewScale * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePreviewScale(previewScale + 0.1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Zoom in"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {draft.linkedInImport.profileUrl ? (
                      <a
                        href={draft.linkedInImport.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        LinkedIn source
                      </a>
                    ) : null}
                  </div>
                </div>
                <div
                  onWheel={(event) => {
                    if (!event.ctrlKey) return;
                    event.preventDefault();
                    updatePreviewScale(previewScale - event.deltaY * 0.001);
                  }}
                  onPointerDown={handlePreviewPointerDown}
                  onPointerMove={handlePreviewPointerMove}
                  onPointerUp={handlePreviewPointerEnd}
                  onPointerCancel={handlePreviewPointerEnd}
                  onPointerLeave={handlePreviewPointerEnd}
                  className="overflow-visible"
                  style={{ touchAction: "none" }}
                >
                  <div
                    className={`mx-auto w-fit origin-top ${
                      isPreviewDragging ? "cursor-grabbing" : "cursor-grab transition-transform"
                    }`}
                    style={{
                      transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewScale})`,
                    }}
                  >
                    <div ref={previewRef}>
                      <ResumePreview resume={draft} />
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </section>
        </main>
      </div>

      <LinkedInPromptDialog
        open={showLinkedInPrompt}
        onOpenChange={setShowLinkedInPrompt}
        onImport={() => {
          setShowLinkedInPrompt(false);
          setShowLinkedInImport(true);
        }}
      />

      <Dialog open={showLinkedInImport} onOpenChange={setShowLinkedInImport}>
        <DialogContent className="max-w-2xl rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Import from LinkedIn</DialogTitle>
            <DialogDescription>
              Use OAuth for basic profile autofill, or paste a LinkedIn URL and upload the
              LinkedIn PDF export for richer parsing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => void startLinkedInOAuth()}
              disabled={linkedInLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
            >
              {linkedInLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Login with LinkedIn
            </button>

            <div className="rounded-3xl border border-dashed border-border p-5">
              <TextInput
                label="LinkedIn Profile URL"
                value={linkedInForm.profileUrl}
                onChange={(value) =>
                  setLinkedInForm((current) => ({ ...current, profileUrl: value }))
                }
                placeholder="https://www.linkedin.com/in/your-profile"
              />

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
