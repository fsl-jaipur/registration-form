import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createApiClient } from "@shared/api/client";

type QuestionText =
  | string
  | {
      text?: string;
      fileUrl?: string;
    };

type QuestionOption =
  | string
  | {
      text?: string;
      fileUrl?: string;
    };

type Question = {
  _id: string;
  question: QuestionText;
  options: QuestionOption[];
  correct_answer: string;
};

type SelectedResponse = {
  selectedAnswer: string;
  selectedOption: string;
};

type ResponseMap = Record<string, SelectedResponse>;

type StartQuizResponse = {
  quizAttemptId: string;
};

type QuestionsResponse = {
  questions: Question[];
  duration: number;
};

type QuizLocationState = {
  quizAttemptId?: string;
};

function QuizPage() {
  const { testId } = useParams<{ testId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const api = createApiClient(import.meta.env.VITE_API_URL || "");
  const locationState = location.state as QuizLocationState | null;

  const [quizAttemptId, setQuizAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<ResponseMap>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [error, setError] = useState("");

  const isQuizFinishedRef = useRef(false);
  const quizAttemptIdRef = useRef<string | null>(null);
  const responsesRef = useRef<ResponseMap>({});
  const questionsRef = useRef<Question[]>([]);

  const requestJson = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      return api.requestJson<T>(path, init);
    },
    [api]
  );

  useEffect(() => {
    isQuizFinishedRef.current = isQuizFinished;
  }, [isQuizFinished]);

  useEffect(() => {
    quizAttemptIdRef.current = quizAttemptId;
  }, [quizAttemptId]);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    if (!testId) {
      setError("Missing test id.");
      setLoading(false);
      return;
    }

    async function startQuizAndFetchQuestions() {
      try {
        setLoading(true);
        setError("");

        const existingQuizAttemptId = locationState?.quizAttemptId;

        if (existingQuizAttemptId) {
          setQuizAttemptId(existingQuizAttemptId);
        } else {
          const startData = await requestJson<StartQuizResponse>(
            `/students/start-quiz/${testId}`,
            {
              method: "POST",
            }
          );

          setQuizAttemptId(startData.quizAttemptId);
        }

        const questionData = await requestJson<QuestionsResponse>(
          `/students/get-questions/${testId}`
        );

        const shuffledQuestions = [...questionData.questions].sort(
          () => Math.random() - 0.5
        );

        setQuestions(shuffledQuestions);
        setTimeLeft(questionData.duration * 60);
      } catch (err) {
        console.error("Error starting quiz or fetching questions:", err);
        const message =
          err instanceof Error && err.message.includes("already attempted")
            ? "You have already attempted this quiz."
            : "Failed to load quiz. Please try again.";
        setError(message);
        if (message === "You have already attempted this quiz.") {
          setTimeout(() => navigate("/student/studentpanel"), 2000);
        }
      } finally {
        setLoading(false);
      }
    }

    startQuizAndFetchQuestions();
  }, [locationState?.quizAttemptId, navigate, requestJson, testId]);

  const calculateScoreFromRefs = useCallback(() => {
    let score = 0;
    questionsRef.current.forEach((question) => {
      const response = responsesRef.current[question._id];
      const isCorrect = response?.selectedAnswer === question.correct_answer;
      if (isCorrect) {
        score += 1;
      }
    });
    return score;
  }, []);

  const showThankYouMessage = useCallback(() => {
    setShowThankYou(true);
    setTimeout(() => navigate("/student/studentpanel"), 5000);
  }, [navigate]);

  const finishQuizSilently = useCallback(
    async (reason = "Auto submission") => {
      if (isQuizFinishedRef.current || !quizAttemptIdRef.current) {
        return;
      }

      try {
        const score = calculateScoreFromRefs();
        await requestJson(`/students/finishQuiz/${quizAttemptIdRef.current}`, {
          method: "POST",
          body: JSON.stringify({ score, reason }),
        });
        isQuizFinishedRef.current = true;
        setShowThankYou(true);
        setTimeout(() => navigate("/student/studentpanel"), 3000);
      } catch (err) {
        console.error("Silent finish error:", err);
      }
    },
    [calculateScoreFromRefs, navigate, requestJson]
  );

  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!isQuizFinishedRef.current && quizAttemptIdRef.current) {
        event.preventDefault();
        event.returnValue = "You have an active quiz. Are you sure you want to leave?";
        finishQuizSilently("Page refreshed or closed");
      }
    },
    [finishQuizSilently]
  );

  const handleUnload = useCallback(() => {
    if (!isQuizFinishedRef.current && quizAttemptIdRef.current) {
      finishQuizSilently();
    }
  }, [finishQuizSilently]);

  const handleVisibilityChange = useCallback(() => {
    if (
      document.visibilityState === "hidden" &&
      !isQuizFinishedRef.current &&
      quizAttemptIdRef.current
    ) {
      finishQuizSilently("Tab switched or hidden");
    }
  }, [finishQuizSilently]);

  const handleWindowBlur = useCallback(() => {
    if (!isQuizFinishedRef.current && quizAttemptIdRef.current) {
      finishQuizSilently("Window lost focus");
    }
  }, [finishQuizSilently]);

  const handleDevToolsOpen = useCallback(() => {
    const threshold = 160;
    const devToolsLikelyOpen =
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold;

    if (!isQuizFinishedRef.current && quizAttemptIdRef.current && devToolsLikelyOpen) {
      finishQuizSilently("Developer tools opened");
    }
  }, [finishQuizSilently]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (!isQuizFinishedRef.current && quizAttemptIdRef.current) {
      event.preventDefault();
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isQuizFinishedRef.current && quizAttemptIdRef.current) {
        const isCtrlPressed = event.ctrlKey || event.metaKey;
        const isShiftPressed = event.shiftKey;

        if (
          event.key === "F12" ||
          (isCtrlPressed && isShiftPressed && event.key.toUpperCase() === "I") ||
          (isCtrlPressed && ["U", "S", "A", "C", "V", "R"].includes(event.key.toUpperCase())) ||
          event.key === "F5"
        ) {
          event.preventDefault();
          finishQuizSilently("Restricted key action");
        }
      }
    },
    [finishQuizSilently]
  );

  const handlePopState = useCallback(() => {
    if (!isQuizFinishedRef.current && quizAttemptIdRef.current) {
      const confirmLeave = window.confirm(
        "Leaving will auto-submit your quiz. Continue?"
      );

      if (confirmLeave) {
        finishQuizSilently("User pressed back button");
        setTimeout(() => {
          window.history.back();
        }, 100);
      } else {
        window.history.pushState(null, "", window.location.pathname);
      }
    }
  }, [finishQuizSilently]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("resize", handleDevToolsOpen);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.history.pushState(null, "", window.location.pathname);

    const resizeObserver = new ResizeObserver(handleDevToolsOpen);
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("resize", handleDevToolsOpen);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      resizeObserver.disconnect();
    };
  }, [
    handleBeforeUnload,
    handleContextMenu,
    handleDevToolsOpen,
    handleKeyDown,
    handlePopState,
    handleUnload,
    handleVisibilityChange,
    handleWindowBlur,
  ]);

  useEffect(() => {
    if (timeLeft <= 0 || isQuizFinished) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizFinished, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSelect = (questionId: string, answerText: string, optionLetter: string) => {
    if (isQuizFinished) {
      return;
    }

    setResponses((prev) => ({
      ...prev,
      [questionId]: { selectedAnswer: answerText, selectedOption: optionLetter },
    }));
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const response = responses[questionId];
    if (!response || submitting || isQuizFinished || !quizAttemptId || !testId) {
      return;
    }

    setSubmitting(true);

    try {
      await requestJson(`/students/submit-answer/${quizAttemptId}/${testId}`, {
        method: "POST",
        body: JSON.stringify({
          questionId,
          selectedAnswer: response.selectedAnswer,
          selectedOption: response.selectedOption,
        }),
      });

      setTimeout(() => {
        if (currentQuestionIndex === questions.length - 1) {
          void handleFinishQuiz();
        } else {
          setCurrentQuestionIndex((idx) => idx + 1);
        }
        setSubmitting(false);
      }, 500);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitting(false);
    }
  };

  const calculateScore = (responseMap: ResponseMap) => {
    let score = 0;
    questions.forEach((question) => {
      const response = responseMap[question._id];
      if (response?.selectedAnswer === question.correct_answer) {
        score += 1;
      }
    });
    return score;
  };

  const handleFinishQuiz = async () => {
    if (isQuizFinished || !quizAttemptId || !testId) {
      return;
    }

    setIsQuizFinished(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const lastResponse = currentQuestion ? responses[currentQuestion._id] : undefined;

      if (currentQuestion && lastResponse) {
        await requestJson(`/students/submit-answer/${quizAttemptId}/${testId}`, {
          method: "POST",
          body: JSON.stringify({
            questionId: currentQuestion._id,
            selectedAnswer: lastResponse.selectedAnswer,
            selectedOption: lastResponse.selectedOption,
          }),
        });
      }

      const score = calculateScore(responses);
      await requestJson(`/students/finishQuiz/${quizAttemptId}`, {
        method: "POST",
        body: JSON.stringify({ score }),
      });

      showThankYouMessage();
    } catch (err) {
      console.error("Finish error:", err);
      setIsQuizFinished(false);
      setError("Error finishing quiz.");
    }
  };

  const handleTimeUp = async () => {
    if (isQuizFinished || !quizAttemptId) {
      return;
    }

    setIsQuizFinished(true);

    try {
      const score = calculateScore(responses);
      await requestJson(`/students/finishQuiz/${quizAttemptId}`, {
        method: "POST",
        body: JSON.stringify({ score, reason: "Time expired" }),
      });
      showThankYouMessage();
    } catch (err) {
      console.error("Time-up submission failed:", err);
      setError("Error submitting after time expired.");
    }
  };

  const getQuestionText = (question: Question) => {
    if (typeof question.question === "object") {
      return question.question.text || "No question text";
    }
    return question.question || "No question text";
  };

  const formatQuestionText = (rawText: string) => {
    if (!rawText) return rawText;
    if (rawText.includes("\n")) return rawText;

    const looksLikeCode =
      rawText.includes("function") ||
      rawText.includes("=>") ||
      rawText.includes("{") ||
      rawText.includes("};") ||
      rawText.includes("console.log");

    if (!looksLikeCode) return rawText;

    return rawText
      .replace(/;\s*/g, ";\n")
      .replace(/\{\s*/g, "{\n")
      .replace(/\s*\}/g, "\n}")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const getQuestionImage = (question: Question) => {
    return typeof question.question === "object" ? question.question.fileUrl : undefined;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion
    ? responses[currentQuestion._id]?.selectedAnswer
    : undefined;
  const progressPercentage = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-24">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-24">
        <div className="w-full max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-emerald-800">
            Thank you for attempting the quiz.
          </h2>
          <p className="mt-2 text-sm text-emerald-700">
            Your submission has been recorded. Redirecting to your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-10 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <p className="text-sm font-semibold">Quiz protection is active.</p>
          <p className="mt-1 text-sm">
            Switching tabs, refreshing, going back, or opening developer tools will submit the quiz automatically.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">Student Quiz</h1>
              </div>
              <div
                className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ${
                  timeLeft <= 300
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                    : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                Time Left: {formatTime(timeLeft)}
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {currentQuestion ? (
            <div className="space-y-6 p-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Question {currentQuestionIndex + 1}
                </p>
                <pre className="whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-mono text-sm text-slate-900">
                  {formatQuestionText(getQuestionText(currentQuestion))}
                </pre>

                {getQuestionImage(currentQuestion) && (
                  <img
                    src={getQuestionImage(currentQuestion)}
                    alt="Question visual"
                    className="mt-4 max-h-80 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain"
                  />
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {currentQuestion.options.map((option, index) => {
                  const optionText =
                    typeof option === "object" ? option.text || "No option text" : option;
                  const optionFile = typeof option === "object" ? option.fileUrl : undefined;
                  const isSelected = selectedAnswer === optionText;

                  return (
                    <button
                      key={`${currentQuestion._id}-${index}`}
                      type="button"
                      onClick={() =>
                        handleSelect(
                          currentQuestion._id,
                          optionText,
                          String.fromCharCode(65 + index)
                        )
                      }
                      disabled={isQuizFinished}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      } ${isQuizFinished ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{optionText}</p>
                          {optionFile && (
                            <a
                              href={optionFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-sm font-medium text-amber-700 underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              View file
                            </a>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">
                  Select one option, then submit to continue.
                </p>

                {currentQuestionIndex === questions.length - 1 && selectedAnswer ? (
                  <button
                    type="button"
                    onClick={() => void handleFinishQuiz()}
                    disabled={isQuizFinished || submitting}
                    className="inline-flex items-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {submitting ? "Submitting..." : "Finish Quiz"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSubmitAnswer(currentQuestion._id)}
                    disabled={!selectedAnswer || isQuizFinished || submitting}
                    className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {submitting ? "Submitting..." : "Submit Answer"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">No questions available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizPage;
