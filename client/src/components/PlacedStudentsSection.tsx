import { useRef, useEffect, useState, useMemo } from "react";
import { Briefcase, MapPin } from "lucide-react";
import Blank from "@/assets/blank.png";

type Student = {
  name: string;
  role: string;
  company: string;
  location: string;
  image: string;
};

function PlacedCard({
  s,
  index,
}: {
  s: Student;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
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

  return (
    <div
      ref={ref}
      className={`group bg-card rounded-2xl overflow-hidden border border-border shadow-md card-hover transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={s.image}
          alt={s.name}
          className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-orange text-primary-foreground text-xs font-bold">
            {s.company}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground">{s.name}</h3>
        <p className="text-sm text-brand-blue mb-3">{s.role}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-brand-orange" /> {s.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} className="text-brand-blue" /> Placed
          </span>
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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

  return (
    <div
      ref={ref}
      className={`group bg-card rounded-2xl overflow-hidden border border-border shadow-md card-hover transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={Blank}
          alt="Future student"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 m-2 pointer-events-none" />
      </div>
      <div className="p-5 flex flex-col items-center text-center space-y-3">
        <h3 className="font-bold text-lg text-foreground">
          This could be you.
        </h3>

        <p className="text-sm text-muted-foreground max-w-[220px]">
          Enroll today and join our wall of success.
        </p>

        <a
          href="/register"
          className="mt-2 w-full px-5 py-3 rounded-lg text-sm font-semibold text-primary-foreground gradient-brand hover:opacity-90 transition-all duration-200"
        >
          Enroll Now
        </a>
      </div>
    </div>
  );
}

export default function PlacedStudentsSection() {
  const apiBase = import.meta.env.VITE_API_URL;
  const apiOrigin = useMemo(
    () => apiBase?.replace(/\/api$/, "") ?? "",
    [apiBase],
  );

  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchPlaced = async () => {
      try {
        const res = await fetch(`${apiBase}/placed-students`);
        if (!res.ok) throw new Error("Failed to fetch placed students");
        const data = await res.json();
        const mapped: Student[] = (data.students ?? []).map(
          (s: { name: string; title: string; company: string; city: string; photo?: string }): Student => ({
            name: s.name,
            role: s.title,
            company: s.company,
            location: s.city,
            image: s.photo?.startsWith("http")
              ? s.photo
              : `${apiOrigin}${s.photo || ""}`,
          }),
        );
        setStudents(mapped);
      } catch (error) {
        console.error(error);
        setStudents([]);
      }
    };

    fetchPlaced();
  }, [apiBase, apiOrigin]);

  return (
    <section id="placements" className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-blue-light text-brand-blue text-sm font-semibold mb-4">
            Our Placed Students
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Success is <span className="text-gradient-brand">Our Story</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            2500+ students placed in top companies. Join our growing family of
            successful tech professionals!
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-12 rounded-full bg-brand-blue" />
            <div className="h-1 w-4 rounded-full bg-brand-orange" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {students.map((s, i) => (
            <PlacedCard key={s.name} s={s} index={i} />
          ))}
          <PlaceholderCard index={students.length} />
        </div>
      </div>
    </section>
  );
}
