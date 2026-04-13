import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Search,
  Trash2,
  X,
  SortAsc,
  SortDesc,
  Users,
  Shield,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/Context/Admincontext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StudentDetailPanel } from "@/pages/AdminPages/AdminStudentDetail";

type Student = {
  _id: string;
  name: string;
  createdAt: string;
};

const sortOptions = [
  { value: "name", label: "Name A -> Z", icon: <SortAsc className="h-4 w-4" /> },
  { value: "opposite", label: "Name Z -> A", icon: <SortDesc className="h-4 w-4" /> },
  { value: "newest", label: "Newest First", icon: <SortDesc className="h-4 w-4" /> },
  { value: "oldest", label: "Oldest First", icon: <SortAsc className="h-4 w-4" /> },
];

const formatRegistrationDate = (value?: string): string => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("en-GB");
};

const AdminViewStudent = (): JSX.Element => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL;

  // Safety net: redirect non-admins (route is already protected)
  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  // Fetch students once
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/students/getStudents`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = (await res.json()) as Student[];
        setStudents(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Could not load students",
          description: "Please refresh or check your connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [apiBase, toast]);

  const filteredStudents = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    let result = students.filter((s) => s.name.toLowerCase().includes(normalized));

    switch (sortBy) {
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "opposite":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result = [...result].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      default:
        break;
    }
    return result;
  }, [students, search, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm("Delete selected students? This cannot be undone.")) return;

    try {
      setDeleting(true);
      const res = await fetch(`${apiBase}/students/deleteMany`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Failed to delete students");

      setStudents((prev) => prev.filter((s) => !selectedIds.includes(s._id)));
      setSelectedIds([]);
      toast({
        title: "Students deleted",
        description: "Selected records were removed successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Delete failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const total = students.length;
  const filtered = filteredStudents.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin / Students</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Student Directory
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Search, sort, and manage student records.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/home"
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-brand-blue hover:text-brand-blue transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Showing</p>
              <p className="text-xl font-bold">{filtered}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Selected</p>
              <p className="text-xl font-bold">{selectedIds.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex flex-wrap items-center gap-3 justify-between border-b border-border px-6 py-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name..."
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  Delete ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Registered</th>
                  <th className="px-6 py-3 text-left font-semibold">Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-6 rounded bg-muted" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-muted" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-muted" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-10 rounded bg-muted" /></td>
                    </tr>
                  ))
                ) : filteredStudents.length ? (
                  filteredStudents.map((student, index) => (
                    <tr key={student._id} className="hover:bg-muted/50 transition">
                      <td className="px-6 py-4 font-semibold text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => setActiveStudentId(student._id)}
                          className="text-brand-blue hover:underline"
                        >
                          {student.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatRegistrationDate(student.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student._id)}
                            onChange={() => toggleSelect(student._id)}
                            className="h-4 w-4 rounded border-border text-brand-blue focus:ring-brand-blue"
                          />
                          <span className="text-xs text-muted-foreground">Select</span>
                        </label>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        No students found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Dialog
        open={Boolean(activeStudentId)}
        onOpenChange={(open) => {
          if (!open) setActiveStudentId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto p-6">
          {activeStudentId ? (
            <StudentDetailPanel
              studentId={activeStudentId}
              embedded
              onClose={() => setActiveStudentId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminViewStudent;
