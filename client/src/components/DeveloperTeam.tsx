import { useMemo } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { useEngineeringTeam } from "@/hooks/useEngineeringTeam";

const getPhotoUrl = (photo?: string) => {
  if (!photo) return "";
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }
  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const apiOrigin = apiBase.replace(/\/api$/, "");
  if (photo.startsWith("/static")) {
    return `${apiOrigin}${photo}`;
  }
  return photo;
};

export default function DeveloperTeam() {
  const { data: teamMembers = [] } = useEngineeringTeam();

  const visibleMembers = useMemo(
    () => teamMembers.filter((member) => member.isVisible !== false),
    [teamMembers],
  );

  return (
    <section className="relative min-h-screen py-24 overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      <div className="container relative mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-orange-light text-brand-orange text-sm font-semibold mb-4">
            Engineering Team
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            The people behind{" "}
            <span className="text-gradient-brand">Full Stack Learning</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A small, focused team building features, supporting students, and
            ensuring platform reliability.
          </p>
        </div>

        {/* Responsive Grid for Team Cards (5 per row on desktop) */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 place-items-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {visibleMembers.map((member, idx) => (
            <div
              key={member._id || idx}
              className="relative group w-full h-[340px] border border-border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-slate-900"
            >
              <img
                src={getPhotoUrl(member.photo)}
                alt={member.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay — fades in on hover */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Name/title — slides up on hover */}
              <div className="absolute left-4 bottom-4 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="font-semibold text-base text-white leading-tight">
                  {member.name}
                </p>
                <p className="text-sm text-white/80 mt-0.5">
                  {member.title}
                </p>
              </div>
            </div>
          ))}

          <div className="w-full h-[340px] border border-border rounded-lg overflow-hidden shadow-lg flex flex-col bg-white dark:bg-slate-900">
            <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <div className="w-20 h-20 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                <User className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-1 px-3 py-4">
              <h1 className="font-bold text-base text-foreground">This could be you</h1>
              <p className="text-muted-foreground text-xs">Your Designation</p>
              <Link
                to="/career"
                className="mt-2 w-full text-center text-xs font-semibold text-white py-2 px-3 rounded-md"
                style={{
                  background: "linear-gradient(to right, #1e3a5f, #c0522a)",
                }}
              >
                Launch your career with us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

