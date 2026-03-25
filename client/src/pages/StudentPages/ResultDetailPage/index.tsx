import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createApiClient } from "@shared/api/client";

type ResultResponse = {
  questionText?: string;
  questionImage?: string | null;
  options?: string[];
  correctAnswer: string;
  selectedOption?: string;
  selectedAnswer?: string;
  isCorrect: boolean;
};

type ResultDetail = {
  studentName: string;
  studentId: string;
  testTitle: string;
  testDuration: number;
  score: number;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  responses: ResultResponse[];
};

function ResultDetailPage() {
  const [resultDetail, setResultDetail] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { quizAttemptId } = useParams<{ quizAttemptId: string }>();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");

  useEffect(() => {
    async function fetchResultDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await api.request(
          `/students/quiz-attempt-detail/${quizAttemptId}`
        );

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Results not yet released for this test.");
          }

          if (response.status === 404) {
            throw new Error("Quiz attempt not found.");
          }

          throw new Error("Failed to load result details. Please try again.");
        }

        const data = (await response.json()) as ResultDetail;
        setResultDetail(data);
      } catch (fetchError) {
        console.error("Failed to fetch result details", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load result details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    if (quizAttemptId) {
      void fetchResultDetail();
    } else {
      setError("Quiz attempt not found.");
      setLoading(false);
    }
  }, [api, quizAttemptId]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-GB");

  const getScorePercentage = (score: number, total: number) => {
    if (!total) {
      return 0;
    }
    return Math.round((score / total) * 100);
  };

  const getScoreTone = (percentage: number) => {
    if (percentage >= 80) {
      return {
        badge: "bg-emerald-100 text-emerald-700",
        text: "text-emerald-700",
        summary: "Excellent!",
      };
    }

    if (percentage >= 60) {
      return {
        badge: "bg-amber-100 text-amber-700",
        text: "text-amber-700",
        summary: "Good effort!",
      };
    }

    return {
      badge: "bg-red-100 text-red-700",
      text: "text-red-700",
      summary: "Keep practicing!",
    };
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading result details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate("/student/result")}
          className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Back to Results
        </button>
      </div>
    );
  }

  if (!resultDetail) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No result details found.
        </div>
        <button
          type="button"
          onClick={() => navigate("/student/result")}
          className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Back to Results
        </button>
      </div>
    );
  }

  const scorePercentage = getScorePercentage(
    resultDetail.score,
    resultDetail.totalQuestions
  );
  const scoreTone = getScoreTone(scorePercentage);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Detailed Score Report</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Quiz Result Details</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/student/result")}
          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to Results
        </button>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{resultDetail.testTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Student: {resultDetail.studentName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Attempted: {formatDate(resultDetail.startTime)}
              </p>
            </div>
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${scoreTone.badge}`}
            >
              {resultDetail.score}/{resultDetail.totalQuestions} ({scorePercentage}%)
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Performance
            </p>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-slate-500">Test Duration</dt>
                <dd>{resultDetail.testDuration} minutes</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-slate-500">Total Questions</dt>
                <dd>{resultDetail.totalQuestions}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-medium text-slate-500">Final Score</dt>
                <dd className={`font-semibold ${scoreTone.text}`}>
                  {resultDetail.score}/{resultDetail.totalQuestions}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Question-wise Analysis</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review each question, your answer, and the correct answer.
          </p>
        </div>

        {resultDetail.responses.map((response, index) => {
          const selectedAnswer = response.selectedAnswer || "Not answered";

          return (
            <div
              key={`${resultDetail.studentId}-${index}`}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
                <h4 className="text-lg font-semibold text-slate-900">
                  Question {index + 1}
                </h4>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    response.isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {response.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <div className="space-y-5 p-6">
                {response.questionText && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Question
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">
                      {response.questionText}
                    </p>
                  </div>
                )}

                {response.questionImage && (
                  <img
                    src={response.questionImage}
                    alt="Question"
                    className="max-h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain"
                  />
                )}

                {response.options && response.options.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Options
                    </p>
                    <div className="mt-3 grid gap-3">
                      {response.options.map((option, optionIndex) => {
                        const isCorrect = option === response.correctAnswer;
                        const isSelected = option === response.selectedAnswer;

                        return (
                          <div
                            key={`${index}-${optionIndex}`}
                            className={`rounded-2xl border px-4 py-3 text-sm ${
                              isCorrect
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : isSelected
                                  ? "border-red-200 bg-red-50 text-red-900"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <div className="min-w-0">
                                <p>{option}</p>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs font-medium">
                                  {isCorrect && (
                                    <span className="text-emerald-700">Correct Answer</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="text-red-700">Your Answer</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Your Answer
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedAnswer}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Correct Answer
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {response.correctAnswer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">Final Score</p>
        <h3 className={`mt-2 text-4xl font-bold ${scoreTone.text}`}>
          {resultDetail.score}/{resultDetail.totalQuestions} ({scorePercentage}%)
        </h3>
        <p className="mt-2 text-sm text-slate-500">{scoreTone.summary}</p>
      </div>
    </div>
  );
}

export default ResultDetailPage;
