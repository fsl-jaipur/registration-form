import { Link } from "react-router-dom";
import LegalDocument, { type DocumentSection } from "@/components/LegalDocument";
import StaticPageShell from "@/components/StaticPageShell";

const privacySections: DocumentSection[] = [
  {
    title: "Scope of This Policy",
    paragraphs: [
      "This Privacy Policy explains how Full Stack Learning collects, uses, stores, and protects personal information when you visit our website, enquire about programs, register for a course, submit forms, or access student and admin features.",
      "The policy applies to information shared through our public website, enrollment forms, career applications, contact requests, student assessments, and any related communication channels operated by Full Stack Learning.",
    ],
  },
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect information that helps us respond to enquiries, deliver training, support learners, and maintain the security of our services. The exact information we collect depends on how you interact with the platform.",
    ],
    bullets: [
      "Identity and contact details such as your name, email address, phone number, city, and educational or professional background.",
      "Enrollment and learning information such as selected course, batch preference, assignments, quiz attempts, progress data, and support requests.",
      "Uploaded materials such as resumes, documents, screenshots, and files shared during admissions, course participation, or hiring workflows.",
      "Technical information such as device type, browser, IP address, pages visited, timestamps, and basic analytics used to improve performance and reliability.",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: [
      "We use personal information to operate the website, respond to enquiries, manage admissions, provide course access, evaluate assessments, communicate important updates, and improve the learner experience.",
      "We may also use information to verify identity, prevent misuse, resolve technical issues, maintain records, and understand how visitors use the website so we can improve content, navigation, and support.",
    ],
    bullets: [
      "To contact you about enquiries, counseling, admissions, classes, schedules, assessments, and support.",
      "To create and manage student or admin access where applicable.",
      "To review applications for courses, internships, jobs, or internal opportunities.",
      "To send relevant service messages, reminders, policy updates, and program information.",
    ],
  },
  {
    title: "Sharing and Disclosure",
    paragraphs: [
      "We do not sell your personal information. We share information only when it is necessary to operate our services, comply with law, or protect legitimate business and safety interests.",
      "Where third-party vendors help us run parts of the platform, they are expected to use the information only for the authorized service they provide to us.",
    ],
    bullets: [
      "Service providers that support hosting, analytics, communication, forms, file storage, or operational workflows.",
      "Internal team members, mentors, and authorized staff who need access to deliver training, support, or administration.",
      "Law enforcement, regulators, courts, or professional advisers when disclosure is legally required or reasonably necessary.",
      "A successor organization in the event of a merger, restructuring, acquisition, or transfer of operations, subject to appropriate safeguards.",
    ],
  },
  {
    title: "Cookies and Analytics",
    paragraphs: [
      "Our website may use cookies, local storage, and similar technologies to keep sessions working correctly, remember preferences, understand traffic patterns, and improve website usability.",
      "You can manage browser settings to block or clear cookies. Some features may not work properly if essential cookies or storage mechanisms are disabled.",
    ],
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We retain personal information only for as long as it is reasonably necessary to fulfill the purposes described in this policy, comply with legal obligations, maintain academic or administrative records, and resolve disputes.",
      "Retention periods may vary depending on the type of information, the nature of your relationship with us, and whether the information is required for admissions, course delivery, student support, finance, security, or compliance purposes.",
    ],
  },
  {
    title: "Data Security",
    paragraphs: [
      "We use reasonable administrative, technical, and organizational safeguards to protect personal information against unauthorized access, misuse, loss, alteration, or disclosure.",
      "No method of transmission or storage is completely risk free. While we work to protect information responsibly, users should also protect their own credentials and notify us promptly if they suspect unauthorized access.",
    ],
  },
  {
    title: "Your Rights and Choices",
    paragraphs: [
      "Depending on applicable law, you may request access to your personal information, correction of inaccurate records, deletion of data that is no longer needed, or withdrawal from certain communications.",
      "Where a request affects active course delivery, account security, compliance obligations, or records we are required to maintain, we may retain limited information to satisfy those responsibilities.",
    ],
    bullets: [
      "Request an update to inaccurate or outdated personal details.",
      "Ask about the categories of information we hold about you.",
      "Opt out of non-essential promotional communication.",
      "Request deletion or restriction where appropriate and legally permitted.",
    ],
  },
  {
    title: "Third-Party Services and External Links",
    paragraphs: [
      "Our website may link to third-party platforms, social networks, maps, or tools for convenience. Their privacy practices are governed by their own terms and policies, not this document.",
      "We encourage users to review the privacy policies of any external websites or services they access through our platform before sharing personal information with them.",
    ],
  },
  {
    title: "Policy Updates and Contact",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, operational needs, or legal obligations. The updated version becomes effective when published on this page.",
      "If you have questions about this policy, your data, or how information is handled by Full Stack Learning, please contact us using the details below.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <StaticPageShell
      eyebrow="Privacy & Data"
      title="Privacy Policy"
      description="Your trust matters to us. This page explains what information Full Stack Learning collects, why we collect it, how we use it, and the choices available to you."
      meta="Last updated: March 22, 2026"
    >
      <LegalDocument
        intro="This Privacy Policy is designed to help students, parents, applicants, and website visitors understand how personal information is handled across our public website, program workflows, and platform access areas."
        sections={privacySections}
        footerNote={
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Contact Full Stack Learning
            </h2>
            <p className="text-sm leading-7 text-muted-foreground md:text-base">
              For privacy-related questions, correction requests, or data access
              enquiries, write to{" "}
              <a
                href="mailto:rohit@fullstacklearning.com"
                className="font-semibold text-brand-blue transition-colors hover:text-brand-orange"
              >
                rohit@fullstacklearning.com
              </a>{" "}
              or call{" "}
              <a
                href="tel:+918824453320"
                className="font-semibold text-brand-blue transition-colors hover:text-brand-orange"
              >
                +91-8824453320
              </a>
              . You can also review our{" "}
              <Link
                to="/terms-of-service"
                className="font-semibold text-brand-blue transition-colors hover:text-brand-orange"
              >
                Terms of Service
              </Link>{" "}
              for platform usage rules and course access conditions.
            </p>
          </div>
        }
      />
    </StaticPageShell>
  );
}
