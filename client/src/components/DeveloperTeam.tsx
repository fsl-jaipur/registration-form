import { useEngineeringTeam } from "@/hooks/useEngineeringTeam";
import { fallbackEngineeringTeam } from "@/lib/api/engineeringTeam";

export default function DeveloperTeam() {
  const { data: team = fallbackEngineeringTeam } = useEngineeringTeam();

  return (
    <section className="relative min-h-screen py-24 overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      <div className="container relative mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20">
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

        {/* Responsive Grid for Team Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 mt-8 overflow-visible place-items-center">
          {team.map((member) => (
            <div
              key={member._id || member.name}
              className="w-full max-w-xs sm:max-w-[320px] md:max-w-[270px] lg:max-w-[280px] h-[340px] border border-white/50 rounded-lg relative flex items-end justify-start overflow-hidden shadow-lg group transition-all duration-300 bg-black/80"
            >
              <img
                className="size-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                src={member.photo}
                alt={member.name}
              />
              {/* Gradient overlay appears on hover instead of always visible */}
              <div
                className={`absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none ${"group-hover:opacity-100 opacity-0"}`}
                style={{
                  background:
                    "linear-gradient(to top, rgba(0, 0, 0, 0.96) 20%, rgba(0,0,0,0.0) 100%)",
                }}
              />
              {/* Name/Title hidden, appears on hover with blur effect */}
              <div
                className={`flex flex-col absolute left-4 bottom-4 z-10 transition-all duration-300 translate-y-6 opacity-0 group-hover:opacity-100 group-hover:translate-y-0`}
                style={{ backdropFilter: "blur(2.5px)" }}
              >
                <h1 className="font-[regular] text-[1.1rem] sm:text-[1.2rem] md:text-[1.1rem] lg:text-[1.25rem] text-white">
                  {member.name}
                </h1>
                <h2 className="text-[0.95rem] sm:text-[1.05rem] md:text-[1rem] text-white">
                  {member.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
