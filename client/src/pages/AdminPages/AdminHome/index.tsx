import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

type TestType = {
  _id: string;
  title: string;
  numQuestions: number;
  duration: number;
  released: boolean;
};

type QuestionContent = {
  text?: string;
  fileUrl?: string;
};

type OptionContent = {
  text?: string;
  fileUrl?: string;
};

type ViewQuestion = {
  question?: string | QuestionContent;
  options?: Array<string | OptionContent>;
};

type ViewTest = {
  _id: string;
  title: string;
  numQuestions?: number;
  duration?: number;
  released?: boolean;
  questions?: ViewQuestion[];
};

type ViewTestResponse = {
  test?: ViewTest;
};

type StatCardProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone: "blue" | "orange" | "muted";
};

const StatCard = ({ label, value, icon, tone }: StatCardProps) => {
  const toneClasses = useMemo(() => {
    if (tone === "blue") return "bg-brand-blue/10 text-brand-blue";
    if (tone === "orange") return "bg-brand-orange/10 text-brand-orange";
    return "bg-muted text-muted-foreground";
  }, [tone]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const AdminHome = (): JSX.Element => {
  const [tests, setTests] = useState<TestType[]>([]);
  const [releaseStatus, setReleaseStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTest, setViewTest] = useState<ViewTest | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_URL;

  const releasedCount = tests.filter((t) => t.released).length;
  const draftCount = tests.length - releasedCount;

  // Fetch Tests
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${apiBase}/test/allTests`, {
          credentials: "include",
        });

        const data = await response.json();
        setTests(data.tests ?? []);
      } catch (error) {
        console.error("Failed to fetch tests", error);
        setReleaseStatus("Failed to fetch tests. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [apiBase]);

  // Toggle Release
  const handleReleasedToggle = async (test: TestType) => {
    try {
      const nextReleased = !test.released;
      setTogglingId(test._id);

      const response = await fetch(`${apiBase}/test/update/${test._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ released: nextReleased }),
      });

      if (!response.ok) {
        throw new Error("Failed to update release status");
      }

      const data = await response.json();
      const updatedTest = data?.test ?? { ...test, released: nextReleased };

      setTests((prev) =>
        prev.map((t) => (t._id === test._id ? updatedTest : t))
      );

      setReleaseStatus(updatedTest.released ? "Test released" : "Test unpublished");
    } catch (error) {
      console.error("Failed to update release status", error);
      setReleaseStatus("Failed to update release status");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Test
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    try {
      await fetch(`${apiBase}/test/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      setTests((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Failed to delete test", error);
      setReleaseStatus("Failed to delete test");
    }
  };

  const handleOpenView = async (id: string) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewTest(null);

    try {
      const res = await fetch(`${apiBase}/test/test/${id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch test");
      }

      const data = (await res.json()) as ViewTestResponse;
      setViewTest(data.test ?? null);
    } catch (error) {
      console.error("Failed to fetch test", error);
      setViewError("Failed to load questions. Please try again.");
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewTest(null);
    setViewError(null);
  };

  // Alert Timeout
  useEffect(() => {
    if (releaseStatus) {
      const timer = setTimeout(() => {
        setReleaseStatus(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [releaseStatus]);

  const alertTone = releaseStatus
    ? releaseStatus.toLowerCase().includes("fail")
      ? "border-red-200 bg-red-50 text-red-700"
      : releaseStatus.toLowerCase().includes("unpublish")
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-green-200 bg-green-50 text-green-700"
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin Control Center</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Assessment Dashboard
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Keep your assessments organized, publish new tests, and monitor student progress using the same polished experience as the rest of the site.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/create/test"
              className="rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90"
            >
              Create Test
            </Link>
            <Link
              to="/admin/tests"
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand-orange hover:text-brand-orange"
            >
              View Results
            </Link>
          </div>
        </div>

        {releaseStatus && (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${alertTone}`}>
            {releaseStatus.toLowerCase().includes("fail") ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <span>{releaseStatus}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total Tests"
            value={tests.length}
            icon={<FileText className="h-6 w-6" />}
            tone="blue"
          />
          <StatCard
            label="Live / Released"
            value={releasedCount}
            icon={<BarChart3 className="h-6 w-6" />}
            tone="orange"
          />
          <StatCard
            label="Drafts"
            value={draftCount}
            icon={<Clock3 className="h-6 w-6" />}
            tone="muted"
          />
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">All Tests</h2>
              <p className="text-sm text-muted-foreground">
                Manage release status, edit questions, and review submissions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Questions</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-16 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-20 rounded bg-muted" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-16 rounded-full bg-muted" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                  : tests.length > 0
                    ? tests.map((test) => (
                      <tr key={test._id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 font-semibold text-foreground">{test.title}</td>
                        <td className="px-4 py-4 text-muted-foreground">{test.numQuestions}</td>
                        <td className="px-4 py-4 text-muted-foreground">{test.duration} mins</td>
                        <td className="px-4 py-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(test.released)}
                              onChange={() => handleReleasedToggle(test)}
                              disabled={togglingId === test._id}
                              className="peer sr-only"
                            />
                            <span className="relative h-5 w-10 rounded-full bg-muted transition-colors peer-checked:bg-brand-blue after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 after:ease-in-out peer-checked:after:translate-x-5" />
                            <span className="text-xs font-medium text-muted-foreground peer-checked:text-brand-blue">
                              {test.released ? "Live" : "Draft"}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/update/test/${test._id}`)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-medium text-xs hover:border-brand-blue hover:text-brand-blue transition"
                            >
                              <Pencil className="h-4 w-4" />
                              Update
                            </button>
                            <button
                              onClick={() => handleOpenView(test._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 font-medium text-xs hover:border-brand-orange hover:text-brand-orange transition"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(test._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 font-medium text-xs text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                          No tests found yet. Create your first assessment to get started.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Test Preview</p>
                <h3 className="text-lg font-semibold text-foreground">
                  {viewTest?.title ?? "View Test"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseView}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-brand-blue hover:text-brand-blue transition"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {viewLoading ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Loading questions...
                </div>
              ) : viewError ? (
                <div className="px-6 py-10 text-center text-sm text-red-600">
                  {viewError}
                </div>
              ) : viewTest?.questions && viewTest.questions.length > 0 ? (
                <div className="divide-y divide-border">
                  {viewTest.questions.map((q, idx) => {
                    const questionText: string =
                      typeof q.question === "object" && q.question !== null
                        ? q.question.text || "WHAT WILL BE THE OUTPUT"
                        : (q.question as string) || "No question text";

                    const questionImage =
                      typeof q.question === "object" && q.question?.fileUrl
                        ? q.question.fileUrl
                        : "";

                    return (
                      <article key={idx} className="px-6 py-5 space-y-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Q{idx + 1}
                          </p>
                          <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                            {questionText}
                          </pre>
                        </div>

                        {questionImage && (
                          <img
                            src={questionImage}
                            alt="Question related"
                            className="w-full max-h-[280px] rounded-xl border border-border bg-background object-contain shadow-sm"
                            loading="lazy"
                          />
                        )}

                        {q.options && q.options.length > 0 && (
                          <ul className="grid gap-2">
                            {q.options.map((opt, i) => {
                              const optionText: string =
                                typeof opt === "object" && opt !== null
                                  ? opt.text || "No option text"
                                  : (opt as string) || "";

                              const optionFile =
                                typeof opt === "object" && opt?.fileUrl
                                  ? opt.fileUrl
                                  : "";

                              return (
                                <li
                                  key={i}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                >
                                  <span>{optionText}</span>
                                  {optionFile && (
                                    <a
                                      href={optionFile}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-brand-blue hover:underline"
                                    >
                                      View File
                                    </a>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No questions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHome;
