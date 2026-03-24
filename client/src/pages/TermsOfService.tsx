import { Link } from "react-router-dom";
import LegalDocument, { type DocumentSection } from "@/components/LegalDocument";
import StaticPageShell from "@/components/StaticPageShell";

const termsSections: DocumentSection[] = [
  {
    title: "Acceptance of Terms",
    paragraphs: [
      "These Terms of Service govern access to and use of the Full Stack Learning website, public content, student resources, and related digital services. By using the website or enrolling in any program, you agree to follow these terms.",
      "If you do not agree with these terms, please do not use the website, submit forms, or access protected student or admin features.",
    ],
  },
  {
    title: "Eligibility and Account Responsibility",
    paragraphs: [
      "You are responsible for ensuring that the information you provide is accurate, current, and complete. If account credentials are issued to you, you are responsible for maintaining their confidentiality and for all activity carried out through your account.",
      "You must not share login credentials, attempt to access another user's account, or use the platform in a way that interferes with course delivery, administration, or platform security.",
    ],
  },
  {
    title: "Programs, Content, and Access",
    paragraphs: [
      "Full Stack Learning offers training programs, assessments, assignments, informational resources, and administrative tools that may change over time. We may update course structure, schedules, modules, faculty allocation, or platform workflows to improve learning outcomes or operations.",
      "Access to student-only or admin-only areas is restricted to authorized users. Certain features may require completion of enrollment, payment formalities, identity checks, or compliance with course rules.",
    ],
  },
  {
    title: "Fees, Payments, and Enrollment",
    paragraphs: [
      "Where fees apply, the price, payment schedule, and batch-specific terms communicated at the time of enrollment form part of your course arrangement with Full Stack Learning.",
      "Any refund, cancellation, rescheduling, or transfer request is subject to the policy communicated for the relevant program or batch. Failure to complete payment obligations may result in delayed access, suspended services, or administrative hold.",
    ],
  },
  {
    title: "Acceptable Use",
    paragraphs: [
      "You agree to use the website and related services lawfully, respectfully, and only for their intended educational or administrative purposes.",
    ],
    bullets: [
      "Do not post, upload, transmit, or share unlawful, abusive, defamatory, discriminatory, or misleading material.",
      "Do not copy platform content, assignments, videos, or internal materials for unauthorized resale, redistribution, or commercial use.",
      "Do not attempt to reverse engineer, disrupt, scrape, overload, or bypass access controls on the website or protected panels.",
      "Do not impersonate staff, mentors, students, or any third party while interacting with the platform or our team.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "Unless otherwise stated, the website design, branding, text, visuals, curriculum frameworks, assignments, assessments, videos, and learning materials are owned by or licensed to Full Stack Learning.",
      "Enrollment grants you a limited, non-transferable right to access course materials for your own learning. It does not transfer ownership or permit public redistribution, resale, republication, or unauthorized derivative use.",
    ],
  },
  {
    title: "Assessments, Results, and Outcomes",
    paragraphs: [
      "Quiz scores, assignments, evaluations, feedback, and completion status are provided to support learning progress. They should not be treated as guaranteed indicators of employment, salary, admissions, or external certification outcomes.",
      "We aim to provide practical training and placement-focused support, but career outcomes depend on multiple factors including attendance, effort, communication, project quality, market conditions, and interview performance.",
    ],
  },
  {
    title: "Termination or Restriction",
    paragraphs: [
      "We may suspend, restrict, or terminate access to the website, course materials, or protected panels if we reasonably believe a user has violated these terms, misused the platform, created security risk, or interfered with normal operations.",
      "Where appropriate, we may also remove content, pause access, or require corrective action before restoring service.",
    ],
  },
  {
    title: "Disclaimers and Limitation of Liability",
    paragraphs: [
      "The website and related services are provided on an as-available basis. While we work to keep information current and services reliable, we do not guarantee uninterrupted availability or that every page will always be error free.",
      "To the fullest extent permitted by law, Full Stack Learning will not be liable for indirect, incidental, special, consequential, or business-interruption losses arising from use of the website, delays, third-party failures, or reliance on informational content.",
    ],
  },
  {
    title: "Governing Law and Updates",
    paragraphs: [
      "These terms are governed by the laws applicable in India. Any dispute related to the website or our services will be subject to the jurisdiction of the competent courts in Jaipur, Rajasthan, unless applicable law requires otherwise.",
      "We may revise these Terms of Service from time to time. Continued use of the website or services after changes are published indicates acceptance of the updated terms.",
    ],
  },
];

export default function TermsOfService() {
  return (
    <StaticPageShell
      eyebrow="Rules & Usage"
      title="Terms of Service"
      description="These terms explain the conditions for using the Full Stack Learning website, accessing course-related services, and interacting with student or admin features."
      meta="Last updated: March 22, 2026"
    >
      <LegalDocument
        intro="Please read these terms carefully before using our website or enrolling in a program. They define the responsibilities, permissions, and boundaries that apply when you interact with Full Stack Learning online."
        sections={termsSections}
        footerNote={
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Questions About These Terms?
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              For clarifications about enrollment terms, platform access, or
              account responsibilities, contact{" "}
              <a
                href="mailto:rohit@fullstacklearning.com"
                className="font-semibold text-brand-blue transition-colors hover:text-brand-orange"
              >
                rohit@fullstacklearning.com
              </a>
              . You can also review our{" "}
              <Link
                to="/privacy-policy"
                className="font-semibold text-brand-blue transition-colors hover:text-brand-orange"
              >
                Privacy Policy
              </Link>{" "}
              to understand how personal information is collected and handled.
            </p>
          </div>
        }
      />
    </StaticPageShell>
  );
}
