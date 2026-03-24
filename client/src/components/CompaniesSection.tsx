import { useRef, useEffect, useState, useMemo } from "react";
import DeveloperTeam from "./DeveloperTeam";

type Company = {
  _id?: string;
  name: string;
  logo?: string;
  order?: number;
};

const CompanyBadge = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center px-6 py-4 mx-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-brand-blue/40 hover:-translate-y-1 transition-all duration-300 min-w-[140px] group cursor-default">
    <span className="text-sm font-semibold text-muted-foreground group-hover:text-brand-blue transition-colors duration-200 whitespace-nowrap">
      {name}
    </span>
  </div>
);

export default function CompaniesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [badgeText, setBadgeText] = useState("Companies Hiring Our Students");
  const [heading, setHeading] = useState("Our Students Work At Top Companies");
  const [description, setDescription] = useState(
    "Our graduates are working at the world's leading technology companies",
  );
  const [companies, setCompanies] = useState<Company[]>([]);

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
    [],
  );

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!apiBase) return;
      try {
        const res = await fetch(`${apiBase}/companies-section`);
        if (!res.ok) throw new Error("Failed to fetch companies");
        const data = await res.json();
        const section = data?.section;
        if (!section) throw new Error("Invalid companies payload");
        setBadgeText(section.badgeText || badgeText);
        setHeading(section.heading || heading);
        setDescription(section.description || description);
        const list: Company[] = section.companies || [];
        setCompanies(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      } catch (error) {
        console.error("companies fetch error", error);
      }
    };

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const doubled = [...companies, ...companies];

  return (
    <>
      <section className="section-padding bg-background overflow-hidden">
        <div className="container mx-auto px-4" ref={ref}>
          <div
            className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange-light text-brand-orange text-sm font-semibold mb-4">
              {badgeText}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {heading}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {description}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-1 w-12 rounded-full bg-brand-orange" />
              <div className="h-1 w-4 rounded-full bg-brand-blue" />
            </div>
          </div>

          {/* Marquee Row 1 */}
          <div className="relative mb-4">
            <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee">
              {doubled.map((c, i) => (
                <CompanyBadge key={`${c.name}-${i}`} name={c.name} />
              ))}
            </div>
          </div>

          {/* Marquee Row 2 - reverse */}
          <div className="relative">
            <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            <div
              className="flex"
              style={{ animation: "marquee 25s linear infinite reverse" }}
            >
              {doubled
                .slice()
                .reverse()
                .map((c, i) => (
                  <CompanyBadge key={`rev-${c.name}-${i}`} name={c.name} />
                ))}
            </div>
          </div>
        </div>
      </section>

      <DeveloperTeam />
    </>
  );
}
