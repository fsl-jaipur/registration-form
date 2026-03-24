import type { ReactNode } from "react";

export type DocumentSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalDocumentProps = {
  intro: string;
  sections: DocumentSection[];
  footerNote?: ReactNode;
};

const getSectionId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function LegalDocument({
  intro,
  sections,
  footerNote,
}: LegalDocumentProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
      <div className="rounded-2xl border border-brand-blue/10 bg-brand-blue-light/35 p-5 md:p-6">
        <p className="text-sm leading-7 text-muted-foreground md:text-base">
          {intro}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.title}
              href={`#${getSectionId(section.title)}`}
              className="rounded-full border border-brand-blue/15 bg-white/80 px-3 py-1.5 text-sm font-medium text-brand-blue transition-colors duration-200 hover:border-brand-blue/30 hover:bg-brand-blue hover:text-white"
            >
              {section.title}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((section, index) => (
          <section
            key={section.title}
            id={getSectionId(section.title)}
            className="scroll-mt-28 border-t border-border pt-8 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-col gap-4 md:flex-row md:gap-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-sm font-bold text-white shadow-sm">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                  {section.title}
                </h2>

                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-muted-foreground md:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground shadow-sm"
                      >
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-orange" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {footerNote && (
        <div className="mt-10 rounded-2xl border border-brand-orange/15 bg-brand-orange/5 p-5 md:p-6">
          {footerNote}
        </div>
      )}
    </div>
  );
}
