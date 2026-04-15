import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

export type UniversalHeaderNavItem = {
  _id?: string;
  label: string;
  href: string;
  order?: number;
  isExternal?: boolean;
};

export type UniversalHeaderButtonStyle = "primary" | "secondary" | "outline";

export type UniversalHeaderButton = {
  _id?: string;
  label: string;
  href: string;
  style: UniversalHeaderButtonStyle;
  order?: number;
};

export type UniversalHeaderData = {
  _id?: string;
  logo: string;
  logoAlt: string;
  navItems: UniversalHeaderNavItem[];
  buttons: UniversalHeaderButton[];
  phone?: string;
  email?: string;
};

export type HeroImage = {
  _id?: string;
  url: string;
  alt?: string;
  order?: number;
};

export type HeroButtonStyle = "primary" | "secondary" | "outline" | "ghost";

export type HeroButton = {
  _id?: string;
  label: string;
  href: string;
  style: HeroButtonStyle;
  icon?: string | null;
  isExternal?: boolean;
  order?: number;
};

export type HeroStat = {
  _id?: string;
  label: string;
  value: number;
  suffix?: string;
  icon?: string | null;
  order?: number;
};

export type HeroSectionData = {
  _id?: string;
  badgeText: string;
  title: string;
  highlightPrefix: string;
  highlightNumber: number;
  highlightSuffix: string;
  description: string;
  animatedWords: string[];
  buttons: HeroButton[];
  stats: HeroStat[];
  images: HeroImage[];
  scrollText: string;
  showScrollIndicator: boolean;
};

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

export type Course = {
  _id?: string;
  title: string;
  description?: string;
  duration?: string;
  students?: string;
  rating?: number;
  level?: string;
  tags?: string[];
};

export type PlacedStudent = {
  name: string;
  role: string;
  company: string;
  location: string;
  image: string;
};

export type Testimonial = {
  _id?: string;
  name: string;
  image: string;
  rating: number;
  text: string;
};

export type CompaniesSectionData = {
  badgeText: string;
  heading: string;
  description: string;
  companies: { name: string; order?: number }[];
};

export type EngineeringMember = {
  _id?: string;
  name: string;
  title: string;
  photo: string;
};

export type GetInTouchData = {
  badgeText: string;
  heading: string;
  highlight: string;
  description: string;
  phone: string;
  email: string;
  mapLink: string;
  courses: string[];
  highlights: string[];
  formEndpoint: string;
  accessKey: string;
};

const sortByOrder = <T extends { order?: number }>(items: T[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const fallbackHeader: UniversalHeaderData = {
  logo: "/images/logo.png",
  logoAlt: "FullStack Learning",
  navItems: [
    { label: "Home", href: "#home", order: 0, isExternal: false },
    { label: "About", href: "#about", order: 1, isExternal: false },
    { label: "Courses", href: "#courses", order: 2, isExternal: false },
    { label: "Placements", href: "#placements", order: 3, isExternal: false },
    { label: "Testimonials", href: "#testimonials", order: 4, isExternal: false },
    { label: "Life at FSL", href: "/lifeatfsl", order: 5, isExternal: false },
    { label: "Career", href: "/career", order: 6, isExternal: false },
    { label: "Contact", href: "#enquiry", order: 7, isExternal: false },
  ],
  buttons: [
    { label: "Enroll Now", href: "/register", style: "primary", order: 0 },
    { label: "Login", href: "/login", style: "outline", order: 1 },
  ],
  phone: "+91-8824453320",
  email: "rohit@fullstacklearning.com",
};

export const fallbackHero: HeroSectionData = {
  badgeText: "#1 Learning Platform in Rajasthan",
  title: "Become A",
  highlightPrefix: "in just",
  highlightNumber: 6,
  highlightSuffix: "Months",
  description: "That's all the time it takes.. Join 5000+ students who transformed their careers!",
  animatedWords: ["Full Stack Developer", "Frontend Developer", "Backend Engineer", "Web Developer"],
  buttons: [
    { label: "Join Now", href: "/register", style: "primary", icon: "ArrowRight", order: 0 },
    { label: "Explore Courses", href: "/login", style: "outline", icon: "Play", order: 1 },
  ],
  stats: [
    { label: "Students Trained", value: 5000, suffix: "+", icon: "Users", order: 0 },
    { label: "Courses", value: 15, suffix: "+", icon: "BookOpen", order: 1 },
    { label: "Placements", value: 2500, suffix: "+", icon: "Award", order: 2 },
    { label: "Avg Salary Hike", value: 85, suffix: "%", icon: "TrendingUp", order: 3 },
  ],
  images: [
    { url: "/images/hero-bg.jpg", alt: "Hero background 1", order: 0 },
  ],
  scrollText: "Scroll",
  showScrollIndicator: true,
};

export const fallbackFooter: FooterData = {
  logo: "/images/logo.png",
  description:
    "FSL is Rajasthan's premier full stack development training institute, helping students launch successful tech careers since 2018.",
  ctaTitle: "Ready to Start Your Tech Career?",
  ctaSubtitle: "Join 5000+ students who transformed their lives with FSL",
  ctaButtonLabel: "Enroll Now",
  ctaButtonHref: "/register",
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
    { label: "Instagram", href: "https://instagram.com/fullstacklearning1", icon: "Instagram", order: 1 },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/fullstacklearning/", icon: "Linkedin", order: 2 },
    { label: "YouTube", href: "https://www.youtube.com/@fullstacklearning", icon: "Youtube", order: 3 },
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

export const fallbackCompanies: CompaniesSectionData = {
  badgeText: "Companies Hiring Our Students",
  heading: "Our Students Work At Top Companies",
  description: "Our graduates are working at the world's leading technology companies",
  companies: [],
};

export const fallbackGetInTouch: GetInTouchData = {
  badgeText: "Get In Touch",
  heading: "Start Your",
  highlight: "Learning Journey",
  description: "Fill out the form and our counselors will get back to you within 24 hours",
  phone: "+91-8824453320",
  email: "rohit@fullstacklearning.com",
  mapLink: "https://maps.app.goo.gl/xbjzCRCa8NAS9YoDA",
  courses: [
    "Full Stack Development",
    "Frontend Development",
    "Backend Development",
    "Database Management",
    "React Native Mobile",
    "DevOps & Cloud",
  ],
  highlights: [
    "100% Placement Assistance",
    "Industry Expert Mentors",
    "Live Project Training",
    "Flexible Batch Timings",
    "EMI Options Available",
  ],
  formEndpoint: "https://api.web3forms.com/submit",
  accessKey: "9896dc59-07e4-4630-9b2d-39348c63866c",
};

const getBaseOrigin = () => {
  const base = getApiBaseUrl();
  if (!base) return "";
  try {
    const url = new URL(base);
    return `${url.protocol}//${url.host}`;
  } catch {
    return base;
  }
};

export function resolveRemoteAsset(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  const baseOrigin = getBaseOrigin();

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (["localhost", "127.0.0.1"].includes(parsed.hostname) && baseOrigin) {
        return `${baseOrigin}${parsed.pathname}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (!baseOrigin) return url;
  return `${baseOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function fetchLandingData() {
  const api = createApiClient(getApiBaseUrl());

  const [header, hero, footer] = await Promise.all([
    api.requestJson<{ header?: Partial<UniversalHeaderData> | null }>("/api/universal-header"),
    api.requestJson<{ hero?: Partial<HeroSectionData> | null }>("/api/hero-section"),
    api.requestJson<{ footer?: Partial<FooterData> | null }>("/api/footer"),
  ]);

  return {
    header: {
      ...fallbackHeader,
      ...(header?.header ?? {}),
      navItems: sortByOrder((header?.header?.navItems as UniversalHeaderNavItem[]) || fallbackHeader.navItems),
      buttons: sortByOrder((header?.header?.buttons as UniversalHeaderButton[]) || fallbackHeader.buttons),
    },
    hero: {
      ...fallbackHero,
      ...(hero?.hero ?? {}),
      buttons: sortByOrder((hero?.hero?.buttons as HeroButton[]) || fallbackHero.buttons),
      stats: sortByOrder((hero?.hero?.stats as HeroStat[]) || fallbackHero.stats),
      images: sortByOrder((hero?.hero?.images as HeroImage[]) || fallbackHero.images),
    },
    footer: {
      ...fallbackFooter,
      ...(footer?.footer ?? {}),
      sections: sortByOrder((footer?.footer?.sections as FooterSection[]) || fallbackFooter.sections),
      socials: sortByOrder((footer?.footer?.socials as FooterSocial[]) || fallbackFooter.socials),
      bottomLinks: sortByOrder((footer?.footer?.bottomLinks as FooterLink[]) || fallbackFooter.bottomLinks),
    },
  };
}

export async function fetchCourses(): Promise<Course[]> {
  const api = createApiClient(getApiBaseUrl());
  const data = await api.requestJson<{ courses?: Course[] }>("/api/courses");
  return (data.courses ?? []).filter((c) => c?.title);
}

export async function fetchPlacedStudents(): Promise<PlacedStudent[]> {
  const api = createApiClient(getApiBaseUrl());
  const data = await api.requestJson<{ students?: any[] }>("/api/placed-students");
  return (data.students ?? []).map((s) => ({
    name: s.name,
    role: s.title,
    company: s.company,
    location: s.city,
    image: resolveRemoteAsset(s.photo),
  }));
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const api = createApiClient(getApiBaseUrl());
  const data = await api.requestJson<{ stories?: any[] }>("/api/success-stories");
  return (data.stories ?? []).map((s) => ({
    _id: s._id,
    name: s.name,
    rating: Number(s.rating) || 0,
    text: s.caption,
    image: resolveRemoteAsset(s.photo),
  }));
}

export async function fetchCompaniesSection(): Promise<CompaniesSectionData> {
  const api = createApiClient(getApiBaseUrl());
  const data = await api.requestJson<{ section?: Partial<CompaniesSectionData> | null }>(
    "/api/companies-section"
  );
  const section = data.section ?? {};
  return {
    badgeText: section.badgeText || fallbackCompanies.badgeText,
    heading: section.heading || fallbackCompanies.heading,
    description: section.description || fallbackCompanies.description,
    companies: sortByOrder(section.companies ?? []),
  };
}

export async function fetchEngineeringTeam(): Promise<EngineeringMember[]> {
  const api = createApiClient(getApiBaseUrl());
  const data = await api.requestJson<{ team?: any[] }>("/api/engineering-team");
  return (data.team ?? []).map((m) => ({
    _id: m._id,
    name: m.name,
    title: m.title,
    photo: resolveRemoteAsset(m.photo),
  }));
}

export async function fetchGetInTouch(): Promise<GetInTouchData> {
  const api = createApiClient(getApiBaseUrl());
  const data = await api.requestJson<{ section?: Partial<GetInTouchData> | null }>(
    "/api/get-in-touch"
  );
  const section = data.section ?? {};
  return {
    ...fallbackGetInTouch,
    ...section,
    courses: Array.isArray(section.courses) ? section.courses : fallbackGetInTouch.courses,
    highlights: Array.isArray(section.highlights) ? section.highlights : fallbackGetInTouch.highlights,
  };
}
