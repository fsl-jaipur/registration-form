import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock, Star, Users } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Link } from "react-router-dom";
import {
  Course,
  courses as fallbackCourses,
  getCourseIcon,
  slugify,
} from "@/lib/courses";
import { useCourses } from "@/hooks/useCourses";

function CourseCard({ course, index }: { course: Course; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
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

  const Icon = course.icon ?? getCourseIcon(course.iconName);
  const slug = course.slug || slugify(course.title);
  const tags = course.tags ?? [];
  const gradient = course.color || "from-brand-blue to-brand-orange";

  return (
    <Link
      ref={ref}
      to={`/courses/${slug}`}
      aria-label={`Explore ${course.title}`}
      className={`group relative bg-card rounded-2xl overflow-hidden border border-border shadow-md card-hover transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } flex h-full cursor-pointer flex-col hover:-translate-y-1 hover:scale-[1.01] hover:border-brand-blue/30 hover:shadow-xl active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 rounded-2xl ring-1 ring-transparent transition-all duration-300 group-hover:ring-brand-blue/20`}
        aria-hidden="true"
      />
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      {course.badge && (
        <div
          className={`absolute top-4 right-4 ${course.badgeColor} text-primary-foreground text-xs font-bold px-3 py-1 rounded-full`}
        >
          {course.badge}
        </div>
      )}

      <div className="relative flex h-full flex-col p-6">
        <div
          className={`inline-flex w-fit p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="text-primary-foreground" size={24} />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2 transition-colors duration-200 group-hover:text-brand-blue">
          {course.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-blue-light text-brand-blue border border-brand-blue/20"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-brand-orange" /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} className="text-brand-blue" /> {course.students}
          </span>
          <span className="flex items-center gap-1">
            <Star size={13} className="text-yellow-500 fill-yellow-500" />{" "}
            {course.rating}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-xs text-muted-foreground border border-border px-2.5 py-1 rounded-full transition-colors duration-200 group-hover:border-brand-blue/20 group-hover:text-foreground">
            {course.level}
          </span>
          {/* <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue/80 transition-all duration-200 group-hover:text-brand-blue">
            Click to explore
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </span> */}
        </div>
      </div>
    </Link>
  );
}

export default function CoursesSection() {
  const { data, isFetching } = useCourses();
  const sortedCourses = (data && data.length > 0 ? data : fallbackCourses)
    .slice()
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  return (
    <section id="courses" className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-blue-light text-brand-blue text-sm font-semibold mb-4">
            What We Offer
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Our <span className="text-gradient-brand">Popular Courses</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Industry-aligned curriculum designed by experts. Frontend | Backend
            | Full Stack
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-12 rounded-full bg-brand-blue" />
            <div className="h-1 w-4 rounded-full bg-brand-orange" />
            <div className="h-1 w-2 rounded-full bg-brand-orange/50" />
          </div>
          {(isFetching) && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" /> Syncing latest
              courses
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course, i) => (
            <CourseCard
              key={course._id ?? course.slug ?? course.title}
              course={course}
              index={i}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#enquiry"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("#enquiry")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-primary-foreground gradient-brand hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Enroll in a Course
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
