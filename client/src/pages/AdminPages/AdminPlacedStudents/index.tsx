import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  Upload,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/Context/Admincontext";

type PlacedStudent = {
  _id: string;
  name: string;
  title: string;
  company: string;
  city: string;
  photo: string;
  order?: number;
};

const AdminPlacedStudents = (): JSX.Element => {
  const [students, setStudents] = useState<PlacedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    title: string;
    company: string;
    city: string;
    position: string;
    file: File | null;
    preview: string | null;
  }>({
    name: "",
    title: "",
    company: "",
    city: "",
    position: "",
    file: null,
    preview: null,
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const apiBase = import.meta.env.VITE_API_URL;

  const apiOrigin = useMemo(
    () => apiBase?.replace(/\/api$/, "") ?? "",
    [apiBase],
  );

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resolveImage = (src: string) =>
    src?.startsWith("http") ? src : `${apiOrigin}${src}`;

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/placed-students`);
        if (!res.ok) throw new Error("Failed to fetch placed students");
        const data = await res.json();
        setStudents(data.students ?? []);
      } catch (error) {
        console.error(error);
        toast({
          title: "Could not load placed students",
          description: "Please refresh or check your connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [apiBase, toast]);

  useEffect(
    () => () => {
      if (form.preview) URL.revokeObjectURL(form.preview);
    },
    [form.preview],
  );

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setForm((prev) => ({ ...prev, file: null, preview: null }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      file,
      preview: URL.createObjectURL(file),
    }));
  };

  const clearImage = () => {
    if (form.preview) URL.revokeObjectURL(form.preview);
    setForm((prev) => ({ ...prev, file: null, preview: null }));
  };

  const resetForm = () => {
    if (form.preview && form.preview.startsWith("blob:")) {
      URL.revokeObjectURL(form.preview);
    }
    setEditingId(null);
    setForm({
      name: "",
      title: "",
      company: "",
      city: "",
      position: "",
      file: null,
      preview: null,
    });
  };

  const startEdit = (student: PlacedStudent) => {
    resetForm();
    setShowForm(true);
    setEditingId(student._id);
    setForm({
      name: student.name,
      title: student.title,
      company: student.company,
      city: student.city,
      position: (student.order || 0).toString(),
      file: null,
      preview: resolveImage(student.photo),
    });
  };

  // Drag-and-drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = students.findIndex((student) => student._id === active.id);
      const newIndex = students.findIndex((student) => student._id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newStudents = arrayMove(students, oldIndex, newIndex);
        
        // Optimistic update
        setStudents(newStudents);

        // Send bulk reorder to backend
        try {
          const studentIds = newStudents.map((student) => student._id);
          
          const response = await fetch(`${apiBase}/placed-students/reorder`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ studentIds }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to reorder students");
          }

          const result = await response.json();
          
          toast({
            title: "Students reordered",
            description: "Order updated successfully.",
          });

          // Refresh the list to get updated order numbers from server
          const res = await fetch(`${apiBase}/placed-students`);
          if (res.ok) {
            const data = await res.json();
            setStudents(data.students ?? []);
          }
        } catch (error: any) {
          console.error("Reorder error:", error);
          toast({
            title: "Reorder failed",
            description: error?.message || "Failed to save new order. Please try again.",
            variant: "destructive",
          });
          // Revert the optimistic update
          const res = await fetch(`${apiBase}/placed-students`);
          if (res.ok) {
            const data = await res.json();
            setStudents(data.students ?? []);
          }
        }
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !form.title.trim() ||
      !form.company.trim() ||
      !form.city.trim() ||
      (!form.file && !editingId && !form.preview)
    ) {
      toast({
        title: "Missing details",
        description: "All fields and a photo are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("title", form.title.trim());
      body.append("company", form.company.trim());
      body.append("city", form.city.trim());
      if (form.position.trim()) {
        body.append("order", form.position.trim());
      }
      if (form.file) body.append("photo", form.file);

      const isEdit = Boolean(editingId);
      const url = isEdit
        ? `${apiBase}/placed-students/${editingId}`
        : `${apiBase}/placed-students`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save student");
      }

      const { student } = await res.json();
      
      // Refresh the entire list to ensure correct ordering
      const refreshRes = await fetch(`${apiBase}/placed-students`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setStudents(refreshData.students ?? []);
      } else {
        // Fallback to manual update if refresh fails
        setStudents((prev) =>
          isEdit
            ? prev.map((s) => (s._id === student._id ? student : s))
            : [student, ...prev],
        );
      }
      resetForm();
      setShowForm(false);
      toast({
        title: isEdit ? "Student updated" : "Student added",
        description: "Homepage updated instantly.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this placed student?")) return;
    try {
      const res = await fetch(`${apiBase}/placed-students/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete");
      }
      
      // Refresh the list to maintain correct order after deletion
      const refreshRes = await fetch(`${apiBase}/placed-students`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setStudents(refreshData.students ?? []);
      } else {
        setStudents((prev) => prev.filter((s) => s._id !== id));
      }
      toast({ title: "Student removed" });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sortable Student Component
  const SortableStudent = ({ student, index }: { student: PlacedStudent; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: student._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group bg-card rounded-2xl overflow-hidden border border-border shadow-md card-hover transition-all duration-500 relative ${
          isDragging ? "z-50" : ""
        }`}
        key={student._id}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={resolveImage(student.photo)}
            alt={student.name}
            className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Order Badge */}
          <div className="absolute top-2 left-2">
            <span className="inline-block px-2 py-1 rounded-full bg-brand-blue text-white text-xs font-bold">
              #{student.order || index + 1}
            </span>
          </div>

          {/* Drag Handle */}
          <button 
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full cursor-grab active:cursor-grabbing hover:bg-white shadow-sm z-10 touch-none"
            title="Drag to reorder"
            type="button"
          >
            <GripVertical className="h-4 w-4 text-brand-blue" />
          </button>

          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-orange text-primary-foreground text-xs font-bold">
              {student.company}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(student)}
                className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10 border border-border shadow-sm opacity-100 z-10"
                aria-label="Edit student"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(student._id)}
                className="rounded-full bg-white/90 p-1 text-red-600 hover:bg-red-50 border border-red-200 shadow-sm opacity-100 z-10"
                aria-label="Delete student"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-foreground">{student.name}</h3>
          <p className="text-sm text-brand-blue mb-3">{student.title}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-brand-orange" /> {student.city}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={12} className="text-brand-blue" /> Placed
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin Control Center</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Placed Students
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Manage student placements with drag-and-drop reordering and manual position control. 
              Use the drag handle (⋮⋮) to reorder students or set specific positions in the edit form.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {editingId ? "Close Form" : "Add New"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Student Photo</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground hover:border-brand-blue">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-brand-blue" />
                      <span className="font-medium text-foreground/80">
                        {form.file ? form.file.name : "Upload an image"}
                      </span>
                    </div>
                    <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-brand-blue shadow-sm">
                      Browse
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFile}
                    />
                  </label>
                  {form.file && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-brand-orange hover:text-brand-orange"
                    >
                      Clear image
                    </button>
                  )}
                </div>
                {form.preview && (
                  <div className="h-40 overflow-hidden rounded-lg border border-border bg-white">
                    <img
                      src={form.preview}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Student Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="e.g., Priya Sharma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Title / Role</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                  placeholder="e.g., Frontend Engineer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="e.g., Accenture"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                  placeholder="e.g., Jaipur"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Position</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="Leave empty for automatic position"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Set a specific display position (1, 2, 3...) or leave empty to add at the end. You can also drag-and-drop to reorder.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Students can be reordered by dragging the grip handle (⋮⋮) or by setting specific positions. Changes sync instantly across admin and public views.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update Student"
                  : "Save Student"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:border-brand-orange hover:text-brand-orange"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        )}

        <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Placed Students</h3>
              <p className="text-xs text-muted-foreground">Mirrors the homepage carousel/grid.</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {students.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
              No placed students yet. Add one to get started.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={students.map((s) => s._id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {students.map((student, idx) => (
                    <SortableStudent key={student._id} student={student} index={idx} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPlacedStudents;
