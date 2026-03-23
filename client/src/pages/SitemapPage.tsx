import { ArrowRight, BookOpen, Lock, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import StaticPageShell from "@/components/StaticPageShell";
import { courses, slugify } from "@/lib/courses";

type SiteLink = {
  label: string;
  description: string;
  to?: string;
  href?: string;
  badge?: string;
};

type SitemapGroup = {
  title: string;
  description: string;
  links: SiteLink[];
};

const sitemapGroups: SitemapGroup[] = [
  {
    title: "Main Pages",
    description:
      "Core public pages for visitors exploring Full Stack Learning, admissions, and brand information.",
    links: [
      {
        label: "Home",
        description: "Landing page with programs, placements, testimonials, and enquiry form.",
        to: "/",
      },
      {
        label: "Life at FSL",
        description: "Gallery and culture-focused page showcasing the learner environment.",
        to: "/lifeatfsl",
      },
      {
        label: "Careers",
        description: "Current opportunities and hiring information for working with FSL.",
        to: "/career",
      },
      {
        label: "Student Registration",
        description: "Admission and signup form for prospective learners.",
        to: "/register",
      },
      {
        label: "Student Login",
        description: "Entry point for enrolled students to access protected resources.",
        to: "/login",
      },
    ],
  },
  {
    title: "Popular Courses",
    description:
      "Program detail pages for the flagship learning tracks currently highlighted on the website.",
    links: courses.map((course) => ({
      label: course.title,
      description: course.description || "Detailed course overview and program information.",
      to: `/courses/${course.slug || slugify(course.title)}`,
    })),
  },
  {
    title: "Student Resources",
    description:
      "Protected student experience pages for learning progress, results, and day-to-day academic workflow.",
    links: [
      {
        label: "Forgot Password",
        description: "Request help regaining access to a student account.",
        to: "/forgot-password",
      },
      {
        label: "Student Panel",
        description: "Main dashboard for enrolled learners.",
        to: "/student/studentpanel",
        badge: "Login required",
      },
      {
        label: "Results",
        description: "Review test attempts and academic performance.",
        to: "/student/result",
        badge: "Login required",
      },
      {
        label: "Assignments",
        description: "Track and review assignment-related information.",
        to: "/student/assignments",
        badge: "Login required",
      },
      {
        label: "Daily Updates",
        description: "Stay aligned with announcements and daily learning updates.",
        to: "/student/daily-updates",
        badge: "Login required",
      },
      {
        label: "Change Password",
        description: "Reset or update credentials for continued account access.",
        to: "/student/changepassword",
        badge: "Login required",
      },
    ],
  },
  {
    title: "Admin Access",
    description:
      "Operational pages used by authorized team members to manage platform content and learner-facing sections.",
    links: [
      {
        label: "Admin Login",
        description: "Secure login for authorized administrators.",
        to: "/admin/login",
      },
      {
        label: "Admin Home",
        description: "Dashboard and internal overview for administrative activity.",
        to: "/admin/home",
        badge: "Admin only",
      },
      {
        label: "Courses Management",
        description: "Manage program and course-related information.",
        to: "/admin/courses",
        badge: "Admin only",
      },
      {
        label: "Assignments Management",
        description: "Create and review assignment-related admin content.",
        to: "/admin/assignments",
        badge: "Admin only",
      },
      {
        label: "Tests and Results",
        description: "Manage tests, result views, and scoring workflows.",
        to: "/admin/tests",
        badge: "Admin only",
      },
      {
        label: "Footer Settings",
        description: "Edit footer content, social links, and legal links.",
        to: "/admin/footer",
        badge: "Admin only",
      },
      {
        label: "Career Page Settings",
        description: "Edit career page hero copy, open roles, benefits, and CTA content.",
        to: "/admin/career",
        badge: "Admin only",
      },
    ],
  },
  {
    title: "Homepage Sections",
    description:
      "Quick links to important sections on the homepage for visitors who want to jump directly to a specific area.",
    links: [
      {
        label: "About Us",
        description: "Overview of the training approach and student-first mission.",
        href: "/#about",
      },
      {
        label: "Courses",
        description: "Browse the featured course cards on the homepage.",
        href: "/#courses",
      },
      {
        label: "Placements",
        description: "Review placement-focused highlights and success indicators.",
        href: "/#placements",
      },
      {
        label: "Testimonials",
        description: "Read learner stories and feedback.",
        href: "/#testimonials",
      },
      {
        label: "Contact",
        description: "Jump directly to the enquiry and contact section.",
        href: "/#enquiry",
      },
    ],
  },
  {
    title: "Legal and Support",
    description:
      "Important policy pages that explain how the platform works, how information is handled, and how users can navigate the site.",
    links: [
      {
        label: "Privacy Policy",
        description: "Understand how personal information is collected, used, and protected.",
        to: "/privacy-policy",
      },
      {
        label: "Terms of Service",
        description: "Review usage rules, platform conditions, and service limitations.",
        to: "/terms-of-service",
      },
      {
        label: "Sitemap",
        description: "This page, designed to help visitors discover key site destinations quickly.",
        to: "/sitemap",
      },
    ],
  },
];

const accessBadgeStyles: Record<string, string> = {
  "Login required": "border-brand-blue/20 bg-brand-blue-light text-brand-blue",
  "Admin only": "border-brand-orange/20 bg-brand-orange/10 text-brand-orange",
};

export default function SitemapPage() {
  return (
    <StaticPageShell
      eyebrow="Navigation Guide"
      title="Sitemap"
      description="Use this page to quickly discover the main public pages, program routes, student resources, admin entry points, and policy pages available across the Full Stack Learning website."
      meta="Updated: March 22, 2026"
      contentClassName="space-y-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="inline-flex rounded-2xl bg-brand-blue-light p-3 text-brand-blue">
            <BookOpen size={22} />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Explore by section
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            This sitemap groups routes by purpose so visitors can move quickly
            between public content, course pages, and authenticated areas
            without searching through the full website manually.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="inline-flex rounded-2xl bg-brand-orange/10 p-3 text-brand-orange">
            <Lock size={22} />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Access notes
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            Some pages listed here require a student or admin login. Those links
            are labeled so users can understand which routes are public and
            which ones are meant for authenticated access only.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {sitemapGroups.map((group) => (
          <section
            key={group.title}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold text-foreground">
              {group.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              {group.description}
            </p>

            <div className="mt-6 space-y-3">
              {group.links.map((item) => {
                const badgeClassName = item.badge
                  ? accessBadgeStyles[item.badge] ||
                    "border-border bg-muted text-muted-foreground"
                  : "";

                const content = (
                  <>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-foreground">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClassName}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0 text-brand-blue transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                );

                if (item.to) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue/25 hover:shadow-md"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue/25 hover:shadow-md"
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="inline-flex rounded-2xl bg-brand-blue-light p-3 text-brand-blue">
          <ShieldCheck size={22} />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Need help finding the right page?
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
          If you are not sure which page you need, start from the home page or
          contact the team at{" "}
          <a
            href="mailto:rohit@fullstacklearning.com"
            className="font-semibold text-brand-blue transition-colors hover:text-brand-orange"
          >
            rohit@fullstacklearning.com
          </a>
          . For students who already have access, the quickest route is usually
          the student login page, while administrators should use the dedicated
          admin login route.
        </p>
      </div>
    </StaticPageShell>
  );
}
