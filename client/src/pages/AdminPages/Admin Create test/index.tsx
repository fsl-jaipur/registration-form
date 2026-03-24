import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/use-toast";

type Question = {
  id: string;
  text: string;
  file: File | null;
  options: string[];
  correctOptionIndex: string;
  codeSnippet: string;
};

type QuestionTextField = "text" | "codeSnippet" | "correctOptionIndex";

type JsonQuizQuestion = {
  id?: number | string;
  text?: string;
  question?: string;
  questionText?: string;
  options?: unknown;
  correctAnswer?: string;
  correct_answer?: string;
  codeSnippet?: string;
};

const DEFAULT_OPTION_COUNT = 4;

let questionIdCounter = 0;

const createEmptyQuestion = (): Question => ({
  id: `question-${questionIdCounter++}`,
  text: "",
  file: null,
  options: Array.from({ length: DEFAULT_OPTION_COUNT }, () => ""),
  correctOptionIndex: "",
  codeSnippet: "",
});

const CreateTestForm = (): JSX.Element => {
  const [title, setTitle] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>(() => [createEmptyQuestion()]);
  const [jsonInput, setJsonInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const apiBase = import.meta.env.VITE_API_URL;
  const totalQuestions = questions.length;

  const resetForm = () => {
    setTitle("");
    setDuration("");
    setQuestions([createEmptyQuestion()]);
    setJsonInput("");
  };

  const updateQuestion = (questionId: string, updater: (question: Question) => Question) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? updater(question) : question
      )
    );
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions((prev) =>
      prev.length === 1 ? prev : prev.filter((question) => question.id !== questionId)
    );
  };

  const handleQuestionChange = (
    questionId: string,
    field: QuestionTextField,
    value: string
  ) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      [field]: value,
    }));
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    updateQuestion(questionId, (question) => {
      const nextOptions = question.options.map((option, index) =>
        index === optionIndex ? value : option
      );

      return {
        ...question,
        options: nextOptions,
        correctOptionIndex:
          question.correctOptionIndex === String(optionIndex) && !value.trim()
            ? ""
            : question.correctOptionIndex,
      };
    });
  };

  const handleFileChange = (questionId: string, file: File | null) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      file,
    }));
  };

  const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    if (/^\d*$/.test(nextValue)) {
      setDuration(nextValue);
    }
  };

  const normalizeImportedJson = (rawInput: string): string => {
    const trimmedInput = rawInput.trim();

    if (!trimmedInput) {
      return trimmedInput;
    }

    const assignmentMatch = trimmedInput.match(
      /^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*([\s\S]*?);?$/
    );

    return assignmentMatch ? assignmentMatch[1].trim() : trimmedInput;
  };

  const parseJsonQuestions = (rawInput: string): Question[] => {
    const parsedInput = normalizeImportedJson(rawInput);

    const parseInputValue = (): JsonQuizQuestion[] | { quizData?: JsonQuizQuestion[] } => {
      try {
        return JSON.parse(parsedInput) as JsonQuizQuestion[] | { quizData?: JsonQuizQuestion[] };
      } catch {
        // Fallback for JS-style input (e.g., template literals, const quizData = [...]).
        // This is for admin-only usage; it lets us handle non-JSON snippets safely enough here.
        const parser = new Function(`"use strict"; return (${parsedInput});`);
        return parser() as JsonQuizQuestion[] | { quizData?: JsonQuizQuestion[] };
      }
    };

    const parsed = parseInputValue();
    const questionList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.quizData)
        ? parsed.quizData
        : null;

    if (!questionList || questionList.length === 0) {
      throw new Error("Paste a JSON array of questions or an object with a quizData array.");
    }

    const indexedQuestions = questionList.map((item, index) => ({
      item,
      index,
    }));

    const hasAnyId = indexedQuestions.some(({ item }) => item?.id !== undefined && item?.id !== null);

    if (hasAnyId) {
      indexedQuestions.sort((a, b) => {
        const aId = a.item?.id;
        const bId = b.item?.id;

        if (aId === undefined || aId === null) return 1;
        if (bId === undefined || bId === null) return -1;

        const aNum = typeof aId === "number" ? aId : Number(aId);
        const bNum = typeof bId === "number" ? bId : Number(bId);
        const aNumValid = Number.isFinite(aNum);
        const bNumValid = Number.isFinite(bNum);

        if (aNumValid && bNumValid) {
          return aNum - bNum;
        }

        return String(aId).localeCompare(String(bId));
      });
    }

    return indexedQuestions.map(({ item }, index) => {
      const textSource =
        typeof item?.text === "string"
          ? item.text
          : typeof item?.questionText === "string"
            ? item.questionText
            : typeof item?.question === "string"
              ? item.question
              : "";

      const text = textSource.trim();
      const rawOptions = Array.isArray(item?.options)
        ? item.options.map((option) => String(option ?? "").trim())
        : [];
      let options = rawOptions.slice(0, DEFAULT_OPTION_COUNT);

      if (options.length < DEFAULT_OPTION_COUNT) {
        options = [
          ...options,
          ...Array.from({ length: DEFAULT_OPTION_COUNT - options.length }, () => ""),
        ];
      }
      const correctAnswerSource =
        typeof item?.correctAnswer === "string"
          ? item.correctAnswer
          : typeof item?.correct_answer === "string"
            ? item.correct_answer
            : "";
      const correctAnswer = correctAnswerSource.trim();
      const codeSnippet =
        typeof item?.codeSnippet === "string" ? item.codeSnippet.trim() : "";

      if (!text) {
        throw new Error(`Imported question ${index + 1} is missing question text.`);
      }

      const correctOptionIndex = options.findIndex((option) => option === correctAnswer);
      const normalizedCorrectIndex = correctOptionIndex === -1 ? "" : String(correctOptionIndex);

      return {
        id: `question-${questionIdCounter++}`,
        text,
        file: null,
        options,
        correctOptionIndex: normalizedCorrectIndex,
        codeSnippet,
      };
    });
  };

  const handleJsonImport = () => {
    const trimmedInput = jsonInput.trim();

    if (!trimmedInput) {
      toast({
        title: "JSON required",
        description: "Paste your quiz JSON before importing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const importedQuestions = parseJsonQuestions(trimmedInput);

      setQuestions((prev) => {
        const hasOnlyEmptyQuestion =
          prev.length === 1 &&
          !prev[0].text.trim() &&
          !prev[0].codeSnippet.trim() &&
          prev[0].options.every((option) => !option.trim()) &&
          !prev[0].file &&
          !prev[0].correctOptionIndex;

        return hasOnlyEmptyQuestion ? importedQuestions : [...prev, ...importedQuestions];
      });

      setJsonInput(trimmedInput);

      toast({
        title: "Questions imported",
        description: `${importedQuestions.length} question${importedQuestions.length === 1 ? "" : "s"} filled into the form. You can still edit them manually before creating the test.`,
      });
    } catch (error) {
      toast({
        title: "Invalid quiz JSON",
        description:
          error instanceof Error
            ? error.message
            : "Please check the JSON format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    const parsedDuration = Number(duration);

    if (!trimmedTitle) {
      toast({
        title: "Missing test title",
        description: "Add a title before creating the test.",
        variant: "destructive",
      });
      return;
    }

    if (!duration || !Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      toast({
        title: "Invalid duration",
        description: "Enter the duration as a whole number of minutes.",
        variant: "destructive",
      });
      return;
    }

    const normalizedQuestions = questions.map((question, index) => {
      const text = question.text.trim();
      const options = question.options.map((option) => option.trim());
      const codeSnippet = question.codeSnippet.trim();
      const correctOptionIndex = Number(question.correctOptionIndex);

      if (!text) {
        throw new Error(`Question ${index + 1} needs a prompt.`);
      }

      if (options.some((option) => !option)) {
        throw new Error(`Fill in all answer options for Question ${index + 1}.`);
      }

      if (
        !Number.isInteger(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        throw new Error(`Select the correct answer for Question ${index + 1}.`);
      }

      return {
        text,
        file: question.file,
        options,
        correct_answer: options[correctOptionIndex],
        codeSnippet: codeSnippet || null,
      };
    });

    if (!normalizedQuestions.length) {
      toast({
        title: "Add a question",
        description: "Create at least one question before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", trimmedTitle);
    formData.append("numQuestions", String(normalizedQuestions.length));
    formData.append("duration", String(parsedDuration));

    formData.append(
      "questions",
      JSON.stringify(
        normalizedQuestions.map(({ file, ...question }) => question)
      )
    );

    normalizedQuestions.forEach((question, index) => {
      if (question.file) {
        formData.append(`questionimage_${index}`, question.file);
      }
    });

    try {
      const res = await fetch(`${apiBase}/test/create`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create test");
      }

      resetForm();
      toast({
        title: "Test created",
        description: "Your assessment is ready for publishing.",
      });
      navigate("/admin/home", { replace: true });
    } catch (err) {
      console.error("Error creating test:", err);
      toast({
        title: "Unable to create test",
        description:
          err instanceof Error
            ? err.message
            : "Please try again or check your connection.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin / Assessments</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Create a New Test
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Build a branded assessment with questions, code snippets, and images. Use the logo-inspired blue & orange palette to keep it aligned with the rest of the site.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-brand-blue hover:text-brand-blue transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Test Details</p>
                <h2 className="text-xl font-semibold">Overview</h2>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
                {totalQuestions} question{totalQuestions === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-foreground">
                Test Title
                <input
                  type="text"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="e.g., Frontend Fundamentals"
                  autoComplete="off"
                  className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-foreground">
                Duration (minutes)
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={duration}
                  onChange={handleDurationChange}
                  placeholder="e.g., 60"
                  autoComplete="off"
                  className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue"
                  required
                />
                <p className="text-xs text-muted-foreground">Enter whole minutes only.</p>
              </label>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Question {index + 1}</p>
                      <h3 className="text-lg font-semibold">Content & Options</h3>
                    </div>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="space-y-1 text-sm font-medium text-foreground">
                      Question Text
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleQuestionChange(q.id, "text", e.target.value)}
                        placeholder="Write the question prompt"
                        autoComplete="off"
                        className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue"
                        required
                      />
                    </label>

                    <label className="space-y-1 text-sm font-medium text-foreground">
                      Code Snippet (optional)
                      <textarea
                        value={q.codeSnippet}
                        onChange={(e) =>
                          handleQuestionChange(q.id, "codeSnippet", e.target.value)
                        }
                        placeholder="Paste any code sample the student should reference"
                        autoComplete="off"
                        className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue"
                        rows={3}
                      />
                    </label>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Image (optional)</p>
                      <label className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-brand-blue hover:text-brand-blue transition cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span>{q.file ? q.file.name : "Upload supporting image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {q.options.map((opt, i) => (
                      <label
                        key={`${q.id}-option-${i}`}
                        className="space-y-1 text-sm font-medium text-foreground"
                      >
                        Option {String.fromCharCode(65 + i)}
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                          autoComplete="off"
                          className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue"
                          required
                        />
                      </label>
                    ))}
                  </div>

                  <label className="space-y-1 text-sm font-medium text-foreground block">
                    Correct Answer
                    <select
                      value={q.correctOptionIndex}
                      onChange={(e) =>
                        handleQuestionChange(q.id, "correctOptionIndex", e.target.value)
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue"
                      required
                    >
                      <option value="">Select correct answer</option>
                      {q.options.map((opt, i) => (
                        <option key={`${q.id}-answer-${i}`} value={String(i)} disabled={!opt.trim()}>
                          {opt.trim()
                            ? `Option ${String.fromCharCode(65 + i)}: ${opt}`
                            : `Option ${String.fromCharCode(65 + i)}`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-blue px-4 py-2.5 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Add Another Question
              </button>
            </div>

            <aside className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-4 h-fit xl:sticky xl:top-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Bulk Import</p>
                <h2 className="text-xl font-semibold">Add Questions with JSON</h2>
                <p className="text-sm text-muted-foreground">
                  Paste your quiz JSON here. When you click import, the questions are added as normal editable question cards, and you can still add more manually.
                </p>
              </div>

              <label className="space-y-1 text-sm font-medium text-foreground block">
                Quiz JSON
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[\n  {\n    "question": "console.log([1,2,3].map(x => x * 2));",\n    "options": ["[1,2,3]", "[2,4,6]", "[1,4,9]", "undefined"],\n    "correctAnswer": "[2,4,6]"\n  }\n]`}
                  className="min-h-[260px] w-full rounded-lg border border-border px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </label>

              <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3 text-xs text-muted-foreground space-y-1">
                <p>Supported keys: <code>question</code>, <code>text</code>, <code>questionText</code>, <code>options</code>, <code>correctAnswer</code>, <code>correct_answer</code>, <code>codeSnippet</code>.</p>
                <p>You can paste raw JSON or code like <code>const quizData = [...]</code>.</p>
                <p>Each imported question must have exactly 4 options.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleJsonImport}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90"
                >
                  Import JSON Questions
                </button>
                <button
                  type="button"
                  onClick={() => setJsonInput("")}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-brand-orange hover:text-brand-orange transition"
                >
                  Clear JSON
                </button>
              </div>
            </aside>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/home")}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:border-brand-orange hover:text-brand-orange transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Test"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateTestForm;
