    import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

type QuestionContent = {
  text?: string;
  fileUrl?: string;
};

type OptionContent = {
  text?: string;
  fileUrl?: string;
};

type Question = {
  question?: string | QuestionContent;
  options?: Array<string | OptionContent>;
};

type Test = {
  _id: string;
  title: string;
  numQuestions?: number;
  duration?: number;
  released?: boolean;
  questions?: Question[];
};

type TestResponse = {
  test?: Test;
};

const ViewTest = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [test, setTest] = useState<Test | null>(null);
  const apiBase = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;

    const fetchTest = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/test/test/${id}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch test");

        const data = (await res.json()) as TestResponse;
        if (!cancelled) setTest(data.test ?? null);
      } catch (error) {
        console.error("Failed to fetch test", error);
        if (!cancelled) setTest(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTest();
    return () => {
      cancelled = true;
    };
  }, [apiBase, id]);

  const meta = useMemo(() => {
    if (!test) return [];
    return [
      { label: "Questions", value: test.numQuestions ?? 0 },
      { label: "Duration", value: `${test.duration ?? 0} mins` },
      { label: "Released", value: test.released ? "Yes" : "No" },
    ];
  }, [test]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-brand-blue" />
          <p className="text-sm text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-10">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg text-center">
            <h3 className="text-2xl font-bold text-foreground">Test not found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We could not locate the requested test.
            </p>
            <div className="mt-4">
              <Link
                to="/admin/home"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-brand-blue hover:text-brand-blue transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">Admin / Tests</p>
          <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
            {test.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {meta.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-blue/5 px-3 py-1 text-xs font-semibold text-foreground"
              >
                <strong className="font-semibold">{item.label}:</strong> {item.value}
              </span>
            ))}
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Questions</h2>
              <p className="text-sm text-muted-foreground">
                Review the questions, images, and options included in this test.
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {test.questions?.length ?? 0} total
            </span>
          </div>

          <div className="divide-y divide-border">
            {test.questions && test.questions.length > 0 ? (
              test.questions.map((q, idx) => {
                const questionText: string =
                  typeof q.question === "object" && q.question !== null
                    ? q.question.text || "WHAT WILL BE THE OUTPUT"
                    : (q.question as string) || "No question text";

                const questionImage =
                  typeof q.question === "object" && q.question?.fileUrl
                    ? q.question.fileUrl
                    : "";

                return (
                  <article key={idx} className="px-6 py-5 space-y-3 hover:bg-muted/40 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Q{idx + 1}
                        </p>
                        <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                          {questionText}
                        </pre>
                      </div>
                    </div>

                    {questionImage && (
                      <img
                        src={questionImage}
                        alt="Question related"
                        className="w-full max-h-[360px] rounded-xl border border-border bg-background object-contain shadow-sm"
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
                              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs"
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
              })
            ) : (
              <div className="px-6 py-6 text-sm text-muted-foreground">No questions found.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ViewTest;
