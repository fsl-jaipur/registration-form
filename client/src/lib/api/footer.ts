import { parseOptionalNumber } from "@/lib/utils";

export type FooterLink = { _id?: string; label: string; href: string; order?: number };
export type FooterSection = { _id?: string; title: string; links: FooterLink[]; order?: number };
export type FooterSocial = { _id?: string; label: string; href: string; icon: string; order?: number };

export type FooterData = {
  _id?: string;
  logo: string;
  description: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLabel: string;
  ctaButtonHref: string;
  sections: FooterSection[];
  socials: FooterSocial[];
  contact: {
    phone: string;
    email: string;
    address: string;
    mapLink: string;
  };
  bottomLinks: FooterLink[];
};

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
const SYSTEM_FOOTER_LINKS: Record<string, string> = {
  "privacy policy": "/privacy-policy",
  "terms of service": "/terms-of-service",
  "terms and conditions": "/terms-of-service",
  "terms & conditions": "/terms-of-service",
  sitemap: "/sitemap",
};

export const FOOTER_QUERY_KEY = ["footer"] as const;

export const fallbackFooter: FooterData = {
  logo: "/images/logo.png",
  description:
    "FSL is Rajasthan's premier full stack development training institute, helping students launch successful tech careers since 2018.",
  ctaTitle: "Ready to Start Your Tech Career?",
  ctaSubtitle: "Join 5000+ students who transformed their lives with FSL",
  ctaButtonLabel: "Enroll Now — It's Free to Enquire!",
  ctaButtonHref: "#enquiry",
  sections: [
    {
      title: "Quick Links",
      order: 0,
      links: [
        { label: "Home", href: "#home", order: 0 },
        { label: "About Us", href: "#about", order: 1 },
        { label: "Courses", href: "#courses", order: 2 },
        { label: "Placements", href: "#placements", order: 3 },
        { label: "Testimonials", href: "#testimonials", order: 4 },
        { label: "Contact", href: "#enquiry", order: 5 },
      ],
    },
    {
      title: "Our Courses",
      order: 1,
      links: [
        { label: "Full Stack Development", href: "#courses", order: 0 },
        { label: "Frontend Development", href: "#courses", order: 1 },
        { label: "Backend Development", href: "#courses", order: 2 },
        { label: "Database Management", href: "#courses", order: 3 },
        { label: "React Native", href: "#courses", order: 4 },
        { label: "DevOps & Cloud", href: "#courses", order: 5 },
      ],
    },
  ],
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/fullstacklearning", icon: "Facebook", order: 0 },
    { label: "Twitter", href: "#", icon: "X", order: 1 },
    { label: "Instagram", href: "https://instagram.com/fullstacklearning1", icon: "Instagram", order: 2 },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/fullstacklearning/", icon: "Linkedin", order: 3 },
    { label: "YouTube", href: "https://www.youtube.com/@fullstacklearning", icon: "Youtube", order: 4 },
  ],
  contact: {
    phone: "+91-8824453320",
    email: "rohit@fullstacklearning.com",
    address: "A-20, Murtikala Colony, Tonk Road\nJaipur, Rajasthan 302018",
    mapLink: "https://maps.app.goo.gl/xbjzCRCa8NAS9YoDA",
  },
  bottomLinks: [
    { label: "Privacy Policy", href: "/privacy-policy", order: 0 },
    { label: "Terms of Service", href: "/terms-of-service", order: 1 },
    { label: "Sitemap", href: "/sitemap", order: 2 },
  ],
};

const sortByOrder = <T extends { order?: number }>(items: T[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const resolveKnownFooterHref = (label: string, href?: string) => {
  const trimmedHref = href?.trim?.() ?? "";
  if (trimmedHref && trimmedHref !== "#") {
    return trimmedHref;
  }

  return SYSTEM_FOOTER_LINKS[label.trim().toLowerCase()] || trimmedHref;
};

const normalizeLinks = (value: unknown, fallback: FooterLink[]) => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = (item as FooterLink).label?.trim?.();
      const href = label
        ? resolveKnownFooterHref(label, (item as FooterLink).href)
        : "";
      if (!label || !href) return null;
      return {
        _id: typeof (item as FooterLink)._id === "string" ? (item as FooterLink)._id : undefined,
        label,
        href,
        order: parseOptionalNumber((item as FooterLink).order),
      };
    })
    .filter(Boolean) as FooterLink[];
  return cleaned.length ? sortByOrder(cleaned) : fallback;
};

const normalizeSections = (value: unknown, fallback: FooterSection[]) => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const title = (item as FooterSection).title?.trim?.();
      if (!title) return null;
      return {
        _id: typeof (item as FooterSection)._id === "string" ? (item as FooterSection)._id : undefined,
        title,
        order: parseOptionalNumber((item as FooterSection).order),
        links: normalizeLinks((item as FooterSection).links, []),
      };
    })
    .filter(Boolean) as FooterSection[];
  return cleaned.length ? sortByOrder(cleaned) : fallback;
};

const normalizeSocials = (value: unknown, fallback: FooterSocial[]) => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = (item as FooterSocial).label?.trim?.();
      const href = (item as FooterSocial).href?.trim?.();
      const icon = (item as FooterSocial).icon?.trim?.();
      if (!label || !href || !icon) return null;
      return {
        _id: typeof (item as FooterSocial)._id === "string" ? (item as FooterSocial)._id : undefined,
        label,
        href,
        icon,
        order: parseOptionalNumber((item as FooterSocial).order),
      };
    })
    .filter(Boolean) as FooterSocial[];
  return cleaned.length ? sortByOrder(cleaned) : fallback;
};

export const normalizeFooter = (data?: Partial<FooterData> | null): FooterData => ({
  _id: typeof data?._id === "string" ? data._id : undefined,
  logo: data?.logo?.trim() || fallbackFooter.logo,
  description: data?.description?.trim() || fallbackFooter.description,
  ctaTitle: data?.ctaTitle?.trim() || fallbackFooter.ctaTitle,
  ctaSubtitle: data?.ctaSubtitle?.trim() || fallbackFooter.ctaSubtitle,
  ctaButtonLabel: data?.ctaButtonLabel?.trim() || fallbackFooter.ctaButtonLabel,
  ctaButtonHref: data?.ctaButtonHref?.trim() || fallbackFooter.ctaButtonHref,
  sections: normalizeSections(data?.sections, fallbackFooter.sections),
  socials: normalizeSocials(data?.socials, fallbackFooter.socials),
  contact: {
    phone: data?.contact?.phone?.trim() || fallbackFooter.contact.phone,
    email: data?.contact?.email?.trim() || fallbackFooter.contact.email,
    address: data?.contact?.address?.trim() || fallbackFooter.contact.address,
    mapLink: data?.contact?.mapLink?.trim() || fallbackFooter.contact.mapLink,
  },
  bottomLinks: normalizeLinks(data?.bottomLinks, fallbackFooter.bottomLinks),
});

export const fetchFooter = async (): Promise<FooterData> => {
  if (!API_BASE) return fallbackFooter;
  const res = await fetch(`${API_BASE}/footer`);
  if (!res.ok) throw new Error("Failed to fetch footer");
  const data = await res.json();
  return normalizeFooter(data?.footer);
};
