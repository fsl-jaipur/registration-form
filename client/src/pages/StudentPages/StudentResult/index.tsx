import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createApiClient } from "@shared/api/client";

type QuizAttempt = {
  _id: string;
  quizAttemptId?: string;
  testId: string;
  testTitle?: string;
  testDuration?: number;
  startTime?: string;
  endTime?: string;
  score?: number;
  responses?: unknown[];
};

type TestMap = Record<
  string,
  {
    _id: string;
    title?: string;
    duration?: number;
    result?: boolean;
  }
>;

function ResultPage() {
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tests, setTests] = useState<TestMap>({});
  const navigate = useNavigate();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");

  useEffect(() => {
    async function fetchQuizAttempts() {
      try {
        setLoading(true);
        setError("");
        const data = await api.requestJson<QuizAttempt[]>("/students/quiz-attempts");

        if (Array.isArray(data)) {
          const formattedAttempts = data.map((attempt) => ({
            ...attempt,
            quizAttemptId: attempt._id,
            testTitle: attempt.testTitle,
            testDuration: attempt.testDuration,
          }));

          setQuizAttempts(formattedAttempts);

          const testsMap: TestMap = {};
          formattedAttempts.forEach((attempt) => {
            testsMap[attempt.testId] = {
              _id: attempt.testId,
              title: attempt.testTitle,
              duration: attempt.testDuration,
              result: true,
            };
          });
          setTests(testsMap);
        }
      } catch (err) {
        console.error("Failed to fetch quiz attempts", err);
        setError("Failed to load quiz results. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuizAttempts();
  }, []);

  const handleViewResult = (quizAttemptId: string, testId: string) => {
    navigate(`/student/result-detail/${quizAttemptId}`, {
      state: { testId },
    });
  };

  const getScoreDisplay = (attempt: QuizAttempt) => {
    if (attempt.score !== undefined && attempt.score !== null) {
      return `${attempt.score}/${attempt.responses?.length || 0}`;
    }
    return "Not completed";
  };

  const getStatusBadge = (attempt: QuizAttempt) => {
    if (attempt.endTime) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        In Progress
      </span>
    );
  };

  const getTestDisplay = (testId: string) => {
    const test = tests[testId];
    if (test) {
      return (
        <div>
          <div className="font-semibold text-slate-900">
            {test.title || "Untitled Test"}
          </div>
          <div className="text-xs text-slate-500">
            {test.duration && `Duration: ${test.duration} min`}
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Results Released
            </span>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="text-sm text-slate-500">Loading test details...</div>
        <div className="text-xs text-slate-400">ID: {testId?.toString().slice(-8)}...</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          <p className="mt-3 text-sm text-slate-600">Loading your quiz results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
        <button
          className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          onClick={() => navigate("/student/studentpanel")}
        >
          Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Quiz Results</h2>
        <button
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => navigate("/student/studentpanel")}
        >
          Back to Tests
        </button>
      </div>

      {quizAttempts.length === 0 ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p className="text-sm font-semibold">No Released Results</p>
          <p className="mt-1 text-sm">
            No quiz results have been released yet. Results will appear here once your instructor releases them.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <span className="font-semibold">Results Available!</span> Your instructor has released the results for {quizAttempts.length} quiz attempt(s).
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Test Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Started At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizAttempts.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3" style={{ minWidth: "200px" }}>
                        {getTestDisplay(attempt.testId)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {attempt.startTime
                          ? new Date(attempt.startTime).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(attempt)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {getScoreDisplay(attempt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          onClick={() =>
                            handleViewResult(
                              attempt.quizAttemptId ?? attempt._id,
                              attempt.testId
                            )
                          }
                          disabled={!attempt.endTime}
                        >
                          {attempt.endTime ? "View Details" : "In Progress"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ResultPage;
