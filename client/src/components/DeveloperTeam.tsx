import { useEngineeringTeam } from "@/hooks/useEngineeringTeam";
import { fallbackEngineeringTeam } from "@/lib/api/engineeringTeam";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import blankImage from "@/assets/blank.png";

export default function DeveloperTeam() {
  const { data: team = fallbackEngineeringTeam } = useEngineeringTeam();
  const cards = [
    ...team.map((member) => ({ type: "member" as const, member })),
    { type: "cta" as const, name: "Name", title: "Designation" },
  ];

  return (
    <section className="relative min-h-screen py-24 overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      <div className="container relative mx-auto max-w-7xl px-4">
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
        <div className="mt-8 grid w-full grid-cols-1 gap-6 overflow-visible place-items-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {cards.map((card) =>
            card.type === "member" ? (
              <div
                key={card.member._id || card.member.name}
                className="group relative flex h-[340px] w-full max-w-xs items-end justify-start overflow-hidden rounded-lg border border-white/50 bg-black/80 shadow-lg transition-all duration-300 sm:max-w-[320px] md:max-w-[270px] lg:max-w-none"
              >
                <img
                  className="size-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                  src={card.member.photo}
                  alt={card.member.name}
                />
                <div
                  className={`absolute inset-0 rounded-lg transition-all duration-300 pointer-events-none ${"group-hover:opacity-100 opacity-0"}`}
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0, 0, 0, 0.96) 20%, rgba(0,0,0,0.0) 100%)",
                  }}
                />
                <div
                  className={`flex flex-col absolute left-4 bottom-4 z-10 transition-all duration-300 translate-y-6 opacity-0 group-hover:opacity-100 group-hover:translate-y-0`}
                  style={{ backdropFilter: "blur(2.5px)" }}
                >
                  <h1 className="font-[regular] text-[1.1rem] sm:text-[1.2rem] md:text-[1.1rem] lg:text-[1.25rem] text-white">
                    {card.member.name}
                  </h1>
                  <h2 className="text-[0.95rem] sm:text-[1.05rem] md:text-[1rem] text-white">
                    {card.member.title}
                  </h2>
                </div>
              </div>
            ) : (
              <div
                key="career-launch-card"
                className="flex h-[340px] w-full max-w-xs flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)] sm:max-w-[320px] md:max-w-[270px] lg:max-w-[280px]"
              >
                <div className="h-[190px] overflow-hidden bg-[#edf3ff]">
                  <img
                    src={blankImage}
                    alt="Career opportunity placeholder"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col items-center justify-between px-5 py-6 text-center">
                  <div className="space-y-2">
                    <h3 className="text-[1.15rem] font-bold leading-tight text-slate-900 sm:text-[1.35rem]">
                      {card.name}
                    </h3>
                    <p className="text-sm font-medium text-[#446fa8]">
                      {card.title}
                    </p>
                  </div>
                  <Button
                    asChild
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#3d73ac] to-[#f36b34] px-4 text-sm font-semibold text-white hover:opacity-95"
                  >
                    <Link to="/career">Launch your career with us</Link>
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
