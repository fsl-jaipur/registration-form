import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Course, normalizeSyllabusModules } from "@/lib/courses";

type CourseLayoutProps = {
  course: Course;
};

export default function CourseLayout({ course }: CourseLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  if (!course) return null;

  const title = course.title ?? "Course";
  const syllabusModules = normalizeSyllabusModules(course.syllabus);
  const description = course.description || course.overview || "Course details will be updated soon.";

  const handleContactNavigation = () => {
    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: "#enquiry" });
      return;
    }

    const enquirySection = document.querySelector("#enquiry");
    if (enquirySection) {
      enquirySection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main
      className={`container mx-auto px-4 py-8 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
    >
      <section className="rounded-3xl overflow-hidden bg-gradient-to-r from-muted/60 to-muted/40 p-6 md:p-10 mb-8 shadow-md">
        <div className="md:flex md:items-center md:justify-between gap-6">
          <div className="md:w-2/3">
            <nav className="text-sm text-muted-foreground mb-4">
              <Link to="/" className="inline-flex items-center gap-2 hover:underline">
                ← Back to Courses 1
              </Link>
            </nav>

            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{title}</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">{description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {course.level && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm">{course.level}</span>
              )}
              {course.duration && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm">{course.duration}</span>
              )}
              {course.students && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm">{course.students}</span>
              )}
            </div>

            {/* <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to="/register" className="px-5 py-2 rounded-lg gradient-brand text-white shadow hover:opacity-95 transition">
                Enroll Now
              </Link>
            </div> */}
          </div>

         
        </div>
      </section>

      <div className="md:grid md:grid-cols-12 gap-8">
        <article className="md:col-span-8 space-y-6">
          <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h2 className="text-2xl font-semibold">About This Course</h2>
            <p className="text-muted-foreground mt-3">{description}</p>
          </section>

          <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h2 className="text-2xl font-semibold">What You'll Learn</h2>
            {syllabusModules.length ? (
              <ul className="grid md:grid-cols-2 gap-3 mt-4">
                {syllabusModules.slice(0, 6).map((module, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">*</span>
                    <span>{module.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm">Syllabus will be published soon.</p>
            )}
          </section>

          <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <h2 className="text-2xl font-semibold">Course Syllabus</h2>
            <p className="text-muted-foreground mt-2">Expand the modules to see more details and topics.</p>

            <div className="mt-4">
              <Accordion type="single" collapsible>
                {syllabusModules.length ? (
                  syllabusModules.map((module, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-foreground">
                        Module {i + 1}: {module.title.length > 60 ? `${module.title.slice(0, 60)}...` : module.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-muted-foreground">{module.title}</div>
                        <ul className="mt-3 text-sm text-muted-foreground grid md:grid-cols-2 gap-2">
                          {module.points.map((point, pointIndex) => (
                            <li key={pointIndex}>- {point}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground py-2">Detailed syllabus coming soon.</div>
                )}
              </Accordion>
            </div>
          </section>
        </article>

        <aside className="md:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-semibold">Course Includes</h3>
              <ul className="mt-3 text-muted-foreground space-y-2">
                {course.duration && <li>- {course.duration}</li>}
                <li>- Live interactive sessions</li>
                <li>- Hands-on projects</li>
                <li>- Certificate of completion</li>
                <li>- Placement assistance</li>
              </ul>
              {/* <button className="mt-6 w-full px-4 py-2 rounded-lg gradient-brand text-white">Enroll Now</button> */}
              <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to="/register" className="mt-6 w-full text-center px-4 py-2 rounded-lg gradient-brand text-white shadow hover:opacity-95 transition">
                Enroll Now
              </Link>
            </div>
            </div>

            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border text-sm text-muted-foreground">
              <h4 className="font-semibold">Support</h4>
              <p className="mt-2">
                Have questions?{" "}
                <button
                  type="button"
                  onClick={handleContactNavigation}
                  className="text-brand-blue hover:underline"
                >
                  Contact us
                </button>{" "}
                for guidance and batch timings.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
