import { Link } from "react-router-dom";
import { User } from "lucide-react";

const teamMembers = [
  {
    name: "Rohit Jain",
    title: "Founder & CEO",
    img: "/images/employees/rohit.jpg ",
  },
  {
    name: "Akshat Sharma",
    title: "Our Frontend Lead",
    img: "/images/employees/akshat.jpeg ",
  },
  {
    name: "Dheeraj Jangid",
    title: "Our DevOps Guy",
    img: "/images/employees/dheeraj.jpg ",
  },
];

export default function DeveloperTeam() {
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
        <div className="mt-8 grid w-full grid-cols-1 gap-6 overflow-visible place-items-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="relative group w-full max-w-xs sm:max-w-[320px] md:max-w-[270px] lg:max-w-[280px] h-[340px] border border-border rounded-lg overflow-hidden shadow-lg bg-white dark:bg-slate-900">
              <img
                src={member.img}
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

          <div className="w-full max-w-xs sm:max-w-[320px] md:max-w-[270px] lg:max-w-[280px] h-[340px] border border-border rounded-lg overflow-hidden shadow-lg flex flex-col bg-white dark:bg-slate-900">
            <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
              <div className="w-24 h-24 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                <User className="w-14 h-14 text-blue-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 px-4 py-5">
              <h1 className="font-bold text-[1.15rem] text-foreground">This could be you</h1>
              <p className="text-muted-foreground text-sm">Your Designation</p>
              <Link
                to="/career"
                className="mt-3 w-full text-center text-sm font-semibold text-white py-2 px-4 rounded-md"
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
