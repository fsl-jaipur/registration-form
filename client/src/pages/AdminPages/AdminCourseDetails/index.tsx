import type React from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  PenSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useCourses, useDeleteCourse, useSaveCourse } from "@/hooks/useCourses";
import { Course, getCourseIcon, slugify } from "@/lib/courses";
import { cn } from "@/lib/utils";

const iconOptions = ["Layers", "Code2", "Server", "Database", "Globe", "Bot", "Smartphone"];
const badgeColors = ["bg-brand-orange", "bg-brand-blue", "bg-green-500", "bg-red-500", "bg-slate-500"];
const gradientOptions = [
  "from-brand-blue to-brand-blue-dark",
  "from-brand-orange to-brand-orange-dark",
  "from-brand-blue to-brand-orange",
  "from-brand-blue-dark to-brand-blue",
];
const durationUnits = ["Days", "Weeks", "Months", "Years"] as const;

type DurationUnit = (typeof durationUnits)[number];

type CourseDraft = Course & {
  durationValue: string;
  durationUnit: DurationUnit;
  tagInput: string;
  syllabusInput: string;
};

type CourseFormErrors = Partial<
  Record<"title" | "slug" | "duration" | "rating" | "level" | "description" | "order", string>
>;

const emptyCourse = (): Course => ({
  title: "",
  description: "",
  overview: "",
  duration: "",
  students: "",
  rating: undefined,
  level: "",
  tags: [],
  syllabus: [],
  badge: null,
  badgeColor: badgeColors[0],
  color: gradientOptions[0],
  iconName: iconOptions[0],
  fee: "",
  order: undefined,
});

const getNextOrder = (courses: Course[]) => Math.max(0, ...courses.map((course) => course.order ?? 0)) + 1;

const uniqueItems = (items: string[]) => {
  const seen = new Set<string>();

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const normalizeDurationUnit = (unit?: string): DurationUnit => {
  const normalized = unit?.trim().toLowerCase() ?? "";
  if (normalized.startsWith("day")) return "Days";
  if (normalized.startsWith("week")) return "Weeks";
  if (normalized.startsWith("year")) return "Years";
  return "Months";
};

const parseDuration = (duration?: string) => {
  const trimmed = duration?.trim() ?? "";
  if (!trimmed) return { value: "", unit: "Months" as DurationUnit };

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)*)?$/);
  if (!match) return { value: "", unit: "Months" as DurationUnit };

  return { value: match[1], unit: normalizeDurationUnit(match[2]) };
};

const formatDuration = (value: string, unit: DurationUnit) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const numericValue = Number(trimmed);
  const singularUnit = unit.endsWith("s") ? unit.slice(0, -1) : unit;
  const finalUnit = numericValue === 1 ? singularUnit : unit;

  return `${trimmed} ${finalUnit}`;
};

const splitTokenInput = (value: string, commitAll = false) => {
  const parts = value.split(/[,\n]/);
  const endsWithSeparator = /[,\n]\s*$/.test(value);
  const committedParts = commitAll || endsWithSeparator ? parts : parts.slice(0, -1);
  const remainder = commitAll || endsWithSeparator ? "" : parts.at(-1) ?? "";

  return {
    committed: committedParts.map((part) => part.trim()).filter(Boolean),
    remainder,
  };
};

const createCourseDraft = (course: Course | undefined, orderHint: number): CourseDraft => {
  const baseCourse = course
    ? {
        ...emptyCourse(),
        ...course,
        tags: uniqueItems(course.tags ?? []),
        syllabus: uniqueItems(course.syllabus ?? []),
        badgeColor: course.badgeColor || badgeColors[0],
        color: course.color || gradientOptions[0],
        iconName: course.iconName || iconOptions[0],
      }
    : emptyCourse();

  const parsedDuration = parseDuration(baseCourse.duration);
  const composedDuration = formatDuration(parsedDuration.value, parsedDuration.unit);

  return {
    ...baseCourse,
    duration: composedDuration || baseCourse.duration || "",
    durationValue: parsedDuration.value,
    durationUnit: parsedDuration.unit,
    tagInput: "",
    syllabusInput: "",
  };
};

const validateCourseDraft = (draft: CourseDraft): CourseFormErrors => {
  const errors: CourseFormErrors = {};
  const slug = draft.slug?.trim() ?? "";

  if (!draft.title.trim()) errors.title = "Title is required.";
  if (slug && slugify(slug) !== slug.toLowerCase()) errors.slug = "Use lowercase letters, numbers, and hyphens only.";

  if (!draft.durationValue.trim()) {
    errors.duration = "Duration is required.";
  } else {
    const durationNumber = Number(draft.durationValue);
    if (Number.isNaN(durationNumber) || durationNumber <= 0) {
      errors.duration = "Enter a positive duration value.";
    }
  }

  if (draft.rating !== undefined && draft.rating !== null) {
    const ratingValue = Number(draft.rating);
    if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      errors.rating = "Rating must be between 0 and 5.";
    }
  }

  if (!draft.level?.trim()) errors.level = "Level is required.";
  if (!draft.description?.trim()) errors.description = "Description is required.";

  if (draft.order === undefined || draft.order === null) {
    errors.order = "Display order is required.";
  } else {
    const orderValue = Number(draft.order);
    if (!Number.isInteger(orderValue) || orderValue < 1) {
      errors.order = "Display order must be 1 or greater.";
    }
  }

  return errors;
};

const buildCoursePayload = (draft: CourseDraft): Course => ({
  _id: draft._id,
  slug: draft.slug?.trim() || undefined,
  title: draft.title.trim(),
  description: draft.description?.trim() || "",
  overview: draft.overview?.trim() || "",
  duration: formatDuration(draft.durationValue, draft.durationUnit),
  students: draft.students?.trim() || "",
  rating: draft.rating === undefined || draft.rating === null ? undefined : Number(draft.rating),
  level: draft.level?.trim() || "",
  tags: uniqueItems(draft.tags ?? []),
  syllabus: uniqueItems(draft.syllabus ?? []),
  badge: draft.badge?.trim() ? draft.badge.trim() : null,
  badgeColor: draft.badgeColor || badgeColors[0],
  color: draft.color || gradientOptions[0],
  iconName: draft.iconName || iconOptions[0],
  fee: draft.fee?.trim() || "",
  order: draft.order === undefined || draft.order === null ? undefined : Number(draft.order),
});

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;

export default function AdminCourseDetails() {
  const { data, isFetching, refetch } = useCourses();
  const { mutateAsync: saveCourse, isPending: isSaving } = useSaveCourse();
  const { mutateAsync: removeCourse, isPending: isDeleting } = useDeleteCourse();
  const { toast } = useToast();

  const courses = useMemo(() => {
    const list = data ?? [];
    return list.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [data]);

  const nextOrder = useMemo(() => getNextOrder(courses), [courses]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [draft, setDraft] = useState<CourseDraft>(() => createCourseDraft(undefined, 1));

  const validationErrors = useMemo(() => validateCourseDraft(draft), [draft]);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const getFieldError = (field: keyof CourseFormErrors) => (showErrors ? validationErrors[field] : undefined);
  const getFieldClassName = (field: keyof CourseFormErrors) =>
    cn(getFieldError(field) && "border-destructive focus-visible:ring-destructive/20");

  const resetEditor = () => {
    setDraft(createCourseDraft(undefined, nextOrder));
    setShowErrors(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetEditor();
  };

  const openEditor = (course?: Course) => {
    setDeleteTarget(null);
    setDraft(createCourseDraft(course, nextOrder));
    setShowErrors(false);
    setDialogOpen(true);
  };

  const setDraftField = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleTextField =
    (key: "title" | "slug" | "students" | "level" | "description" | "overview" | "fee" | "badge") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraftField(key, event.target.value);
    };

  const handleNumberField =
    (key: "rating" | "order") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDraftField(key, value ? Number(value) : undefined);
    };

  const handleDurationValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDraft((prev) => ({
      ...prev,
      durationValue: value,
      duration: formatDuration(value, prev.durationUnit),
    }));
  };

  const handleDurationUnitChange = (value: string) => {
    const durationUnit = value as DurationUnit;
    setDraft((prev) => ({
      ...prev,
      durationUnit,
      duration: formatDuration(prev.durationValue, durationUnit),
    }));
  };

  const addTagsFromValue = (value: string, commitAll = true) => {
    const { committed, remainder } = splitTokenInput(value, commitAll);
    if (!committed.length && remainder === draft.tagInput) return;

    setDraft((prev) => ({
      ...prev,
      tags: uniqueItems([...(prev.tags ?? []), ...committed]),
      tagInput: remainder,
    }));
  };

  const handleTagInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.includes(",") || value.includes("\n")) {
      addTagsFromValue(value, false);
      return;
    }

    setDraftField("tagInput", value);
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTagsFromValue(draft.tagInput, true);
      return;
    }

    if (event.key === "Backspace" && !draft.tagInput && (draft.tags?.length ?? 0) > 0) {
      event.preventDefault();
      setDraft((prev) => ({
        ...prev,
        tags: (prev.tags ?? []).slice(0, -1),
      }));
    }
  };

  const handleTagPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = event.clipboardData.getData("text");
    if (/[,\n]/.test(pastedValue)) {
      event.preventDefault();
      addTagsFromValue(pastedValue, true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((tag) => tag !== tagToRemove),
    }));
  };

  const addSyllabusItems = (value: string, commitAll = true) => {
    const { committed, remainder } = splitTokenInput(value, commitAll);
    if (!committed.length && remainder === draft.syllabusInput) return;

    setDraft((prev) => ({
      ...prev,
      syllabus: uniqueItems([...(prev.syllabus ?? []), ...committed]),
      syllabusInput: remainder,
    }));
  };

  const handleSyllabusInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.includes(",") || value.includes("\n")) {
      addSyllabusItems(value, false);
      return;
    }

    setDraftField("syllabusInput", value);
  };

  const handleSyllabusKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSyllabusItems(draft.syllabusInput, true);
      return;
    }

    if (event.key === "Backspace" && !draft.syllabusInput && (draft.syllabus?.length ?? 0) > 0) {
      event.preventDefault();
      setDraft((prev) => ({
        ...prev,
        syllabus: (prev.syllabus ?? []).slice(0, -1),
      }));
    }
  };

  const handleSyllabusPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = event.clipboardData.getData("text");
    if (/[,\n]/.test(pastedValue)) {
      event.preventDefault();
      addSyllabusItems(pastedValue, true);
    }
  };

  const removeSyllabusItem = (itemToRemove: string) => {
    setDraft((prev) => ({
      ...prev,
      syllabus: (prev.syllabus ?? []).filter((item) => item !== itemToRemove),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowErrors(true);

    if (hasValidationErrors) {
      const firstError = Object.values(validationErrors)[0];
      toast({
        title: "Please fix the highlighted fields",
        description: firstError || "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = buildCoursePayload(draft);
      const savedCourse = await saveCourse(payload);
      toast({
        title: draft._id ? "Course updated" : "Course created",
        description: `${savedCourse.title || "Course"} is now live in the course list.`,
      });
      handleDialogOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save course. Please try again.";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeCourse(deleteTarget);
      const isDeletingOpenCourse =
        (deleteTarget._id && draft._id === deleteTarget._id) ||
        (!deleteTarget._id && deleteTarget.slug && draft.slug === deleteTarget.slug);

      if (isDeletingOpenCourse) {
        handleDialogOpenChange(false);
      }

      toast({
        title: "Course deleted",
        description: `${deleteTarget.title || "Course"} has been removed.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete the course. Please try again.";
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const previewCard = (course: CourseDraft) => {
    const Icon = getCourseIcon(course.iconName);
    const gradient = course.color || gradientOptions[0];
    const tags = course.tags ?? [];
    const syllabus = course.syllabus ?? [];

    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5 text-brand-blue" />
                {course.title || "Untitled course"}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {course.level || "Level TBD"} | {course.duration || "Duration TBD"}
              </p>
            </div>
            {course.badge && (
              <Badge className={`${course.badgeColor} text-white`}>
                <Sparkles className="mr-1 h-3 w-3" />
                {course.badge}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {course.description || "Description coming soon."}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No tags added yet</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course.students && <span>{course.students} learners</span>}
            {course.rating !== undefined && <span>Rating {course.rating}</span>}
            <span>{syllabus.length} modules</span>
          </div>
          <div className={`h-1 w-full rounded-full bg-gradient-to-r ${gradient}`} />
        </CardContent>
      </Card>
    );
  };

  const liveSlug = draft.slug?.trim() || (draft.title.trim() ? slugify(draft.title) : "auto-generated");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Control the home page course tiles and course detail pages</p>
            <h1 className="bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-3xl font-bold leading-tight text-transparent">
              Course Details
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{courses.length} courses live</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span>Add, edit, reorder, and remove courses without leaving this screen</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button onClick={() => openEditor()} className="gradient-brand text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </div>
        </div>

        {courses.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Plus className="h-6 w-6 text-brand-blue" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">No courses yet</h2>
                <p className="text-sm text-muted-foreground">
                  Create the first course card and it will appear on the website immediately after saving.
                </p>
              </div>
              <Button onClick={() => openEditor()} className="gradient-brand text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const Icon = getCourseIcon(course.iconName);
              const gradient = course.color || gradientOptions[0];
              return (
                <Card key={course._id ?? course.slug ?? course.title} className="border-border transition hover:border-brand-blue/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-lg bg-gradient-to-br p-2 ${gradient}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{course.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {course.level || "Level"} | {course.duration || "Duration"} | {course.students || "Students"}
                          </p>
                        </div>
                      </div>
                      {course.badge && <Badge className={`${course.badgeColor} text-white`}>{course.badge}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="line-clamp-3 text-muted-foreground">
                      {course.description || "Description coming soon."}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(course.tags ?? []).slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(course.tags?.length ?? 0) > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{(course.tags?.length ?? 0) - 5} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Rating: {course.rating ?? "-"}</span>
                      <span>Order: {course.order ?? "-"}</span>
                    </div>
                    <div className={`h-1 w-full rounded-full bg-gradient-to-r ${gradient}`} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => openEditor(course)}>
                        <PenSquare className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDeleteTarget(course)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft._id ? "Edit Course" : "Create Course"}</DialogTitle>
              <DialogDescription>
                Update course details, control how the card appears on the website, and preview changes before saving.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 pb-4 md:grid-cols-[1.1fr_1.6fr]">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Live preview</p>
                {previewCard(draft)}
                <div className="flex items-start gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-blue" />
                  Changes save live to the home page tiles and course detail pages after you hit Save.
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course URL</p>
                  <p className="mt-2 text-sm font-medium text-foreground">/courses/{liveSlug}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="text-base font-semibold">Core Details</h2>
                    <p className="text-sm text-muted-foreground">Set the information students see first on the website.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={draft.title}
                        onChange={handleTextField("title")}
                        className={getFieldClassName("title")}
                        placeholder="Full Stack Development"
                        required
                      />
                      <FieldError message={getFieldError("title")} />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={draft.slug || ""}
                        onChange={handleTextField("slug")}
                        onBlur={() => {
                          if (!draft.slug?.trim()) return;
                          setDraft((prev) => ({ ...prev, slug: slugify(prev.slug || "") }));
                        }}
                        className={getFieldClassName("slug")}
                        placeholder="auto-generated from title"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave blank to auto-generate. Final URL: <span className="font-medium">/courses/{liveSlug}</span>
                      </p>
                      <FieldError message={getFieldError("slug")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="durationValue">Duration</Label>
                      <div className="grid grid-cols-[1fr_150px] gap-2">
                        <Input
                          id="durationValue"
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={draft.durationValue}
                          onChange={handleDurationValueChange}
                          className={getFieldClassName("duration")}
                          placeholder="6"
                        />
                        <Select value={draft.durationUnit} onValueChange={handleDurationUnitChange}>
                          <SelectTrigger className={getFieldClassName("duration")}>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {durationUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Example: `6 Months`, `12 Days`</p>
                      <FieldError message={getFieldError("duration")} />
                    </div>
                    <div>
                      <Label htmlFor="students">Students</Label>
                      <Input
                        id="students"
                        value={draft.students || ""}
                        onChange={handleTextField("students")}
                        placeholder="1200+"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={draft.rating ?? ""}
                        onChange={handleNumberField("rating")}
                        className={getFieldClassName("rating")}
                        placeholder="4.8"
                      />
                      <FieldError message={getFieldError("rating")} />
                    </div>
                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Input
                        id="level"
                        value={draft.level || ""}
                        onChange={handleTextField("level")}
                        className={getFieldClassName("level")}
                        placeholder="Beginner to Advanced"
                      />
                      <FieldError message={getFieldError("level")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="order">Display Order</Label>
                      <Input
                        id="order"
                        type="number"
                        min="1"
                        step="1"
                        value={draft.order ?? ""}
                        onChange={handleNumberField("order")}
                        className={getFieldClassName("order")}
                        placeholder={String(nextOrder)}
                      />
                      <FieldError message={getFieldError("order")} />
                    </div>
                    <div>
                      <Label htmlFor="fee">Fee</Label>
                      <Input id="fee" value={draft.fee || ""} onChange={handleTextField("fee")} placeholder="Rs 45,000" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="text-base font-semibold">Presentation</h2>
                    <p className="text-sm text-muted-foreground">Choose how the course card looks on the website.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label>Icon</Label>
                      <Select value={draft.iconName || iconOptions[0]} onValueChange={(value) => setDraftField("iconName", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gradient</Label>
                      <Select value={draft.color || gradientOptions[0]} onValueChange={(value) => setDraftField("color", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose gradient" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradientOptions.map((gradient) => (
                            <SelectItem key={gradient} value={gradient}>
                              {gradient}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <Label htmlFor="badge">Badge Label</Label>
                      <Input id="badge" value={draft.badge ?? ""} onChange={handleTextField("badge")} placeholder="Most Popular" />
                    </div>
                    <div>
                      <Label>Badge Color</Label>
                      <Select
                        value={draft.badgeColor || badgeColors[0]}
                        onValueChange={(value) => setDraftField("badgeColor", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pick badge color" />
                        </SelectTrigger>
                        <SelectContent>
                          {badgeColors.map((color) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-border p-4">
                  <div>
                    <h2 className="text-base font-semibold">Course Content</h2>
                    <p className="text-sm text-muted-foreground">Write the content once and manage tags and syllabus items with chips.</p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={draft.description || ""}
                      onChange={handleTextField("description")}
                      className={getFieldClassName("description")}
                      placeholder="Short summary shown on course cards"
                    />
                    <FieldError message={getFieldError("description")} />
                  </div>

                  <div>
                    <Label htmlFor="overview">Overview</Label>
                    <Textarea
                      id="overview"
                      rows={4}
                      value={draft.overview || ""}
                      onChange={handleTextField("overview")}
                      placeholder="Longer explanation for the course detail page"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tagInput">Tags</Label>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="flex min-h-8 flex-wrap gap-2">
                        {(draft.tags ?? []).length > 0 ? (
                          (draft.tags ?? []).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-brand-blue-light px-3 py-1 text-xs font-medium text-brand-blue"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="rounded-full text-brand-blue/70 transition hover:text-brand-blue"
                                aria-label={`Remove ${tag}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No tags added yet.</span>
                        )}
                      </div>
                      <Input
                        id="tagInput"
                        value={draft.tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagKeyDown}
                        onPaste={handleTagPaste}
                        onBlur={() => addTagsFromValue(draft.tagInput, true)}
                        className="mt-3 border-0 px-0 shadow-none focus-visible:ring-0"
                        placeholder="Type a tag and press Enter or comma"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add one tag at a time, or paste several separated by commas.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="syllabusInput">Syllabus / Modules</Label>
                    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
                      <div className="space-y-2">
                        {(draft.syllabus ?? []).length > 0 ? (
                          (draft.syllabus ?? []).map((item, index) => (
                            <div
                              key={`${item}-${index}`}
                              className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                            >
                              <span className="flex-1 text-foreground">{item}</span>
                              <button
                                type="button"
                                onClick={() => removeSyllabusItem(item)}
                                className="rounded-full text-muted-foreground transition hover:text-foreground"
                                aria-label={`Remove ${item}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No syllabus items added yet.</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="syllabusInput"
                          value={draft.syllabusInput}
                          onChange={handleSyllabusInputChange}
                          onKeyDown={handleSyllabusKeyDown}
                          onPaste={handleSyllabusPaste}
                          onBlur={() => addSyllabusItems(draft.syllabusInput, true)}
                          placeholder="Add a module and press Enter"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addSyllabusItems(draft.syllabusInput, true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Press Enter to add one item, or paste multiple items separated by commas.
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                    Live preview updates as you type.
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {draft._id && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setDeleteTarget({
                            _id: draft._id,
                            slug: draft.slug,
                            title: draft.title,
                          })
                        }
                        disabled={isSaving}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Course
                      </Button>
                    )}
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <PenSquare className="mr-2 h-4 w-4" />}
                      Save Course
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete course?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.title
                  ? `This will permanently remove "${deleteTarget.title}" from the website and admin panel.`
                  : "This will permanently remove the selected course from the website and admin panel."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Course
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
