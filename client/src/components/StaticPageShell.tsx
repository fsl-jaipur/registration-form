import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StaticPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  children: ReactNode;
  contentClassName?: string;
};

export default function StaticPageShell({
  eyebrow,
  title,
  description,
  meta,
  children,
  contentClassName,
}: StaticPageShellProps) {
  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.14),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_100%)]">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-8 top-10 h-28 w-28 rounded-full bg-brand-orange/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-brand-blue/15 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue-light px-4 py-1.5 text-sm font-semibold text-brand-blue">
              {eyebrow}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              {description}
            </p>
            {meta && (
              <div className="mt-6 inline-flex rounded-full border border-brand-blue/15 bg-white/70 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
                {meta}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className={cn("mx-auto max-w-5xl", contentClassName)}>{children}</div>
      </section>
    </main>
  );
}
