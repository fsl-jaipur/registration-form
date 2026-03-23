import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parseOptionalNumber, toNumberInputValue } from "@/lib/utils";

type QuestionFile = {
  text?: string;
  fileUrl?: string;
};

type Question = {
  question: QuestionFile;
  options: string[];
  correct_answer: string;
};

type Test = {
  title: string;
  numQuestions: number;
  duration: number;
  questions: Question[];
};

type EditableTest = Omit<Test, "numQuestions" | "duration"> & {
  numQuestions?: number;
  duration?: number;
};

function UpdateTest(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [editableTest, setEditableTest] = useState<EditableTest | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const apiBase = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchTest = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/test/test/${id}`, { credentials: "include" });
        const data = await res.json();
        setTest(data.test);
        setEditableTest(data.test);
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [apiBase, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableTest) return;
    const { name, value } = e.target;
    if (name === "numQuestions" || name === "duration") {
      setEditableTest({
        ...editableTest,
        [name]: parseOptionalNumber(value),
      } as EditableTest);
      return;
    }

    setEditableTest({
      ...editableTest,
      [name]: value,
    } as EditableTest);
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    if (!editableTest) return;
    const updatedQuestions = [...editableTest.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      question: {
        ...updatedQuestions[index].question,
        [field]: value,
      },
    };
    setEditableTest({ ...editableTest, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    if (!editableTest) return;
    const updatedQuestions = [...editableTest.questions];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    updatedOptions[optIndex] = value;
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
    setEditableTest({ ...editableTest, questions: updatedQuestions });
  };

  const handleCorrectAnswerChange = (idx: number, value: string) => {
    if (!editableTest) return;
    const updated = [...editableTest.questions];
    updated[idx].correct_answer = value;
    setEditableTest({ ...editableTest, questions: updated });
  };

  const handleSubmit = async () => {
    if (!editableTest) return;

    if (
      !Number.isInteger(editableTest.numQuestions) ||
      editableTest.numQuestions <= 0 ||
      !Number.isInteger(editableTest.duration) ||
      editableTest.duration <= 0
    ) {
      alert("Number of questions and duration must be positive whole numbers.");
      return;
    }

    const payload: Test = {
      ...editableTest,
      numQuestions: editableTest.numQuestions,
      duration: editableTest.duration,
    };

    try {
      await fetch(`${apiBase}/test/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      setTest(payload);
      setEditableTest(payload);
      setIsEditing(false);
      navigate("/admin/home");
    } catch (error) {
      console.error("Failed to update test:", error);
      alert("Failed to update test.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-brand-blue" />
          <p className="text-sm text-muted-foreground">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (!test || !editableTest) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-10">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg text-center">
            <h3 className="text-2xl font-bold text-foreground">Failed to load test data.</h3>
            <p className="text-sm text-muted-foreground mt-2">Please try again later.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-6 max-w-5xl">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">Admin / Tests</p>
          <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
            Update Test
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit the test details and questions. Toggle edit mode, then save your changes.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card shadow-lg p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <input
                name="title"
                value={editableTest.title}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Number of Questions</label>
              <input
                type="number"
                name="numQuestions"
                value={toNumberInputValue(editableTest.numQuestions)}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Duration (mins)</label>
              <input
                type="number"
                name="duration"
                value={toNumberInputValue(editableTest.duration)}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Questions</h2>
              <p className="text-sm text-muted-foreground">
                Update the prompt, image, options, and correct answer for each question.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {editableTest.questions.length} total
            </span>
          </div>

          <div className="divide-y divide-border">
            {editableTest.questions.map((q, idx) => (
              <article key={idx} className="px-6 py-5 space-y-4 hover:bg-muted/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Question</p>
                    <h3 className="text-base font-semibold text-foreground">#{idx + 1}</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Text</label>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={q.question?.text || ""}
                      onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  ) : (
                    <p className="text-sm text-foreground">{q.question?.text}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Image URL</label>
                  {isEditing ? (
                    <input
                      value={q.question?.fileUrl || ""}
                      onChange={(e) => handleQuestionChange(idx, "fileUrl", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  ) : (
                    q.question?.fileUrl && (
                      <img
                        src={q.question.fileUrl}
                        alt={`Question ${idx + 1}`}
                        className="w-full max-h-[320px] rounded-xl border border-border bg-background object-contain shadow-sm"
                      />
                    )
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Options</p>
                  <div className="grid gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          Option {optIdx + 1}
                        </span>
                        {isEditing ? (
                          <input
                            value={opt}
                            onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                          />
                        ) : (
                          <span className="text-foreground">{opt}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Correct Answer</label>
                  {isEditing ? (
                    <input
                      value={q.correct_answer}
                      onChange={(e) => handleCorrectAnswerChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-brand-blue">{q.correct_answer}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition disabled:opacity-60"
            onClick={() => {
              if (isEditing) {
                void handleSubmit();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Update" : "Edit"}
          </button>

          {isEditing && (
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-brand-orange hover:text-brand-orange transition"
              onClick={() => {
                setIsEditing(false);
                setEditableTest(test);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default UpdateTest;
