import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileText, Clock3, ListChecks } from "lucide-react";

type TestRecord = {
  testId: string;
  date: string;
  time: string;
};

type TestName = {
  _id: string;
  title: string;
};

const formatDateDDMMYYYY = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function AllTests(): JSX.Element {
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [testName, setTestName] = useState<TestName[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL;

  async function fetchTests(): Promise<void> {
    try {
      const res = await fetch(`${apiBase}/test/allTests`, {
        credentials: "include",
      });

      const data = await res.json();
      const attempted: TestRecord[] = Array.isArray(data.attemptedTests)
        ? data.attemptedTests.map((attempt: { testId: string; startTime: string }) => {
            const dateObj = new Date(attempt.startTime);
            return {
              testId: attempt.testId,
              date: formatDateDDMMYYYY(attempt.startTime),
              time: dateObj.toLocaleTimeString(),
            };
          })
        : [];

      setTestName(data.tests);
      setTests(attempted);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch tests", error);
      setError("Failed to fetch tests");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTests();
  }, []);

  const stats = useMemo(
    () => ({
      totalPublished: testName.length,
      uniqueAttempted: tests.length,
    }),
    [testName.length, tests.length],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/home">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/admin/tests">Results</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>All Tests</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold leading-tight text-gradient-brand">
              All Tests & Attempts
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Review every test that has been attempted and jump directly to detailed score reports.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Published Tests</p>
              <p className="text-xl font-bold">{stats.totalPublished}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attempted (unique)</p>
              <p className="text-xl font-bold">{stats.uniqueAttempted}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data status</p>
              <p className="text-sm font-semibold text-foreground">
                {loading ? "Loading..." : "Up to date"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">Test Attempts</h2>
              <p className="text-sm text-muted-foreground">
                Unique attempts grouped by test. Click through for scores.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">S. No.</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Test Title</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Time</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading
                  ? Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-10 rounded bg-muted" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-48 rounded bg-muted" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 rounded bg-muted" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-muted" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-8 w-24 rounded bg-muted" />
                        </td>
                      </tr>
                    ))
                  : tests.length === 0 || error ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                          {error ? `Error: ${error}` : "No tests found."}
                        </td>
                      </tr>
                    )
                  : tests.map((test, index) => {
                      const matchingTest = testName.find((t) => t._id === test.testId);
                      const testTitle = matchingTest ? matchingTest.title : "Unknown Title";

                      return (
                        <tr key={test.testId} className="hover:bg-muted/50 transition">
                          <td className="px-6 py-4 font-semibold text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{testTitle}</td>
                          <td className="px-6 py-4 text-muted-foreground">{test.date}</td>
                          <td className="px-6 py-4 text-muted-foreground">{test.time}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => navigate(`/admin/test/${test.testId}/scores`)}
                              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90"
                            >
                              View Results
                            </button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
