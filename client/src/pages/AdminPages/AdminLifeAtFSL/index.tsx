import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Upload,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Pencil,
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/Context/Admincontext";

type LifeAtFslItem = {
  _id: string;
  imageUrl: string;
  publicId: string;
  order: number;
  createdAt?: string;
};

type FilePreview = {
  file: File;
  previewUrl: string;
};

const AdminLifeAtFSL = (): JSX.Element => {
  const [images, setImages] = useState<LifeAtFslItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, role, authChecked } = useAdminContext();

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
    []
  );

  const apiOrigin = useMemo(
    () => apiBase?.replace(/\/api$/, "") ?? "",
    [apiBase]
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

  const resolveImage = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }
    return `${apiOrigin}${src}`;
  };

  // Auth Protection
  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  // Fetch gallery images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/life-at-fsl`);
      if (!res.ok) throw new Error("Failed to fetch Life at FSL gallery images");
      const data = await res.json();
      setImages(data.images ?? []);
    } catch (error) {
      console.error("fetchImages error:", error);
      toast({
        title: "Could not load gallery images",
        description: "Please refresh or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [apiBase]);

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [selectedFiles]);

  const handleFilesSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: FilePreview[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAllSelectedFiles = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
  };

  // Trigger file dialog for editing/replacing a specific image
  const triggerEdit = (id: string) => {
    setEditingImageId(id);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
      editFileInputRef.current.click();
    }
  };

  // Handle single image edit upload
  const handleEditFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingImageId) return;

    const targetId = editingImageId;
    try {
      setUpdatingId(targetId);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${apiBase}/life-at-fsl/${targetId}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update image");
      }

      toast({
        title: "Image updated",
        description: "Gallery image replaced successfully.",
      });

      fetchImages();
    } catch (error: any) {
      console.error("Edit error:", error);
      toast({
        title: "Update failed",
        description: error?.message || "Could not replace image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
      setEditingImageId(null);
    }
  };

  // Save new order to backend
  const saveOrderToBackend = async (newImagesList: LifeAtFslItem[]) => {
    try {
      const imageIds = newImagesList.map((img) => img._id);
      const response = await fetch(`${apiBase}/life-at-fsl/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save reorder");
      }

      toast({
        title: "Gallery reordered",
        description: "Display order updated successfully.",
      });

      fetchImages();
    } catch (error: any) {
      console.error("Reorder error:", error);
      toast({
        title: "Reorder failed",
        description: error?.message || "Failed to save new image order.",
        variant: "destructive",
      });
      fetchImages(); // Revert
    }
  };

  // Drag End handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img._id === active.id);
      const newIndex = images.findIndex((img) => img._id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = arrayMove(images, oldIndex, newIndex);
        setImages(updated);
        saveOrderToBackend(updated);
      }
    }
  };

  // Move Up / Move Down controls
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = arrayMove(images, index, targetIndex);
    setImages(updated);
    saveOrderToBackend(updated);
  };

  // Submit Upload Form
  const handleSubmitUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      selectedFiles.forEach((f) => {
        formData.append("images", f.file);
      });

      const res = await fetch(`${apiBase}/life-at-fsl`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to upload gallery images");
      }

      toast({
        title: "Upload successful",
        description: `${selectedFiles.length} image(s) uploaded to Cloudinary and added to gallery.`,
      });

      clearAllSelectedFiles();
      setShowForm(false);
      fetchImages();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: error?.message ?? "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete image
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this gallery image? It will also be removed from Cloudinary.")) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/life-at-fsl/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete image");
      }

      toast({
        title: "Image deleted",
        description: "Image removed from gallery and Cloudinary.",
      });

      fetchImages();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sortable Image Component
  const SortableImageCard = ({
    item,
    index,
    total,
  }: {
    item: LifeAtFslItem;
    index: number;
    total: number;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group bg-white rounded-2xl overflow-hidden border border-border shadow-md transition-all duration-300 relative flex flex-col ${
          isDragging ? "z-50 shadow-2xl ring-2 ring-brand-blue" : "hover:shadow-lg"
        }`}
      >
        {/* Card Header & Preview */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
          <img
            src={resolveImage(item.imageUrl)}
            alt={`Life at FSL Gallery Image #${item.order}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Order Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-blue/90 text-white text-xs font-bold shadow-md backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3" /> #{item.order || index + 1}
            </span>
          </div>

          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full cursor-grab active:cursor-grabbing hover:bg-white text-brand-blue shadow-md z-10 touch-none transition-transform hover:scale-110"
            title="Drag to reorder"
            type="button"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Card Body & Controls */}
        <div className="p-4 flex items-center justify-between border-t border-border bg-slate-50/50">
          {/* Move Up/Down Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleMove(index, "up")}
              disabled={index === 0}
              className="p-1.5 rounded-lg border border-border bg-white text-slate-700 hover:bg-brand-blue-light hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Move Up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleMove(index, "down")}
              disabled={index === total - 1}
              className="p-1.5 rounded-lg border border-border bg-white text-slate-700 hover:bg-brand-blue-light hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Move Down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Edit & Delete Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerEdit(item._id)}
              disabled={updatingId === item._id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-blue bg-brand-blue-light/70 hover:bg-brand-blue-light border border-brand-blue/20 transition-colors disabled:opacity-50"
              aria-label="Edit image"
              title="Replace image"
            >
              {updatingId === item._id ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDelete(item._id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              aria-label="Delete image"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hidden File Input for Image Replacement */}
      <input
        type="file"
        ref={editFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleEditFileChange}
      />

      <main className="container mx-auto px-4 py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-brand-orange uppercase tracking-wider">
              Admin Gallery Management
            </p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Lifestyle (Life at FSL Gallery)
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Upload multiple images to Cloudinary, replace/edit existing images, reorder gallery display order using drag & drop or move controls, and manage items in real-time for the public <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-blue font-mono text-xs">/lifeatfsl</code> page.
            </p>
          </div>
          <button
            onClick={() => {
              clearAllSelectedFiles();
              setShowForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Close Upload Form" : "Upload New Images"}
          </button>
        </div>

        {/* Upload Form */}
        {showForm && (
          <form
            onSubmit={handleSubmitUpload}
            className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-blue" />
                  Select Images to Upload
                </label>
                <span className="text-xs text-muted-foreground">
                  Stored securely in Cloudinary
                </span>
              </div>

              {/* Upload Input Area */}
              <label className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-8 text-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-all">
                <div className="rounded-full bg-brand-blue/10 p-4 text-brand-blue group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Click to select multiple images or drag & drop files here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, JPEG, WEBP or GIF (max 10MB per file)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFilesSelect}
                />
              </label>
            </div>

            {/* Selected File Previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Queued Images ({selectedFiles.length})
                  </h4>
                  <button
                    type="button"
                    onClick={clearAllSelectedFiles}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {selectedFiles.map((item, idx) => (
                    <div
                      key={`preview-${idx}`}
                      className="relative h-28 rounded-lg overflow-hidden border border-border group bg-slate-900"
                    >
                      <img
                        src={item.previewUrl}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-600 shadow transition-transform group-hover:scale-110"
                        title="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  clearAllSelectedFiles();
                  setShowForm(false);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || selectedFiles.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Uploading to Cloudinary...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Gallery Items Grid */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Current Gallery Images</h3>
              <p className="text-xs text-muted-foreground">
                Drag the grip handle (⋮⋮) or use Up/Down buttons to reorder items. Click Edit to replace any image.
              </p>
            </div>
            <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
              {images.length} total images
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-sm font-medium text-muted-foreground">
              <Spinner className="h-5 w-5 text-brand-blue" />
              Loading gallery images...
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-slate-50/50 p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-500">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No gallery images found.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Click "Upload New Images" above to add pictures to the Life at FSL gallery.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((img) => img._id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {images.map((item, idx) => (
                    <SortableImageCard
                      key={item._id}
                      item={item}
                      index={idx}
                      total={images.length}
                    />
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

export default AdminLifeAtFSL;
