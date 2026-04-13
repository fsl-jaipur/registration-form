import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApiClient } from "@shared/api/client";

type Test = {
  _id: string;
  title: string;
  numQuestions: number;
  duration: number;
  released?: boolean;
};

function StudentPanel() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const navigate = useNavigate();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");

  useEffect(() => {
    async function fetchTests() {
      try {
        setLoading(true);
        setError("");
        const data = await api.requestJson<{ tests?: Test[] }>("/test/allTests");
        const releasedTests = (data.tests ?? []).filter((test) => test.released);
        setTests(releasedTests);
      } catch (error) {
        console.error("Failed to fetch tests", error);
        setError("Failed to load tests. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchTests();
  }, []);

  const handleStartTest = async (testId: string) => {
    try {
      setStartingTestId(testId);
      setError("");
      const response = await api.request(`/students/start-quiz/${testId}`, {
        method: "POST",
      });

      const data = (await response.json()) as { message?: string; quizAttemptId?: string };

      if (!response.ok) {
        if (response.status === 400 && data.message === "You have already attempted this quiz.") {
          setError("You have already attempted this quiz.");
          return;
        }
        throw new Error(data.message || "Failed to start quiz");
      }

      navigate(`/student/quiz/${testId}`, {
        state: { quizAttemptId: data.quizAttemptId },
      });
    } catch (startError) {
      console.error("Failed to start test", startError);
      setError("Failed to start quiz. Please try again.");
    } finally {
      setStartingTestId(null);
    }
  };
  const goToResultPage = () => {
    navigate("/student/result");
  };
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
        <p className="text-sm font-semibold">Quiz Security Notice</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">Important:</span> This quiz is monitored for integrity.
          Switching tabs, opening new windows, using developer tools, or attempting to copy content
          will automatically submit your quiz with the current score.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Available Tests</h2>
        <button
          className="inline-flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
          onClick={goToResultPage}
        >
          Result
        </button>
      </div>

      {error && !loading && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Questions
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Duration (mins)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Start
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Loading tests...
                  </td>
                </tr>
              ) : tests.length > 0 ? (
                tests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{test.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{test.numQuestions}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{test.duration}</td>
                    <td className="px-4 py-3">
                      <button
                        className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
                        onClick={() => void handleStartTest(test._id)}
                        disabled={startingTestId === test._id}
                      >
                        {startingTestId === test._id ? "Starting..." : "Start"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    No tests available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentPanel;
