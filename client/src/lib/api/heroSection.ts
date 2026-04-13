import { parseOptionalNumber } from "@/lib/utils";

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

type HeroResponse = { hero?: Partial<HeroSectionData> | null };

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export const HERO_QUERY_KEY = ["hero-section"] as const;
export const HERO_STORAGE_KEY = "fsl_hero_section_updated_at";

const sortByOrder = <T extends { order?: number }>(items: T[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const normalizePath = (value: string) =>
  !value ? value : value.startsWith("http") || value.startsWith("//") ? value : value.startsWith("/") ? value : `/${value}`;

const normalizeImages = (images: unknown): HeroImage[] => {
  if (!Array.isArray(images)) return [];
  const cleaned = images
    .map((img) => {
      if (!img || typeof img !== "object") return null;
      const url = (img as HeroImage).url?.trim?.();
      if (!url) return null;
      return {
        _id: typeof (img as HeroImage)._id === "string" ? (img as HeroImage)._id : undefined,
        url: normalizePath(url),
        alt: (img as HeroImage).alt?.trim?.() || "",
        order: parseOptionalNumber((img as HeroImage).order),
      };
    })
    .filter(Boolean) as HeroImage[];
  return sortByOrder(cleaned);
};

const normalizeButtons = (buttons: unknown): HeroButton[] => {
  if (!Array.isArray(buttons)) return [];
  const cleaned = buttons
    .map((btn) => {
      if (!btn || typeof btn !== "object") return null;
      const label = (btn as HeroButton).label?.trim?.();
      const href = (btn as HeroButton).href?.trim?.();
      if (!label || !href) return null;
      const style = (btn as HeroButton).style;
      return {
        _id: typeof (btn as HeroButton)._id === "string" ? (btn as HeroButton)._id : undefined,
        label,
        href,
        style: style === "secondary" || style === "outline" || style === "ghost" ? style : "primary",
        icon: (btn as HeroButton).icon || "",
        isExternal: Boolean((btn as HeroButton).isExternal),
        order: parseOptionalNumber((btn as HeroButton).order),
      };
    })
    .filter(Boolean) as HeroButton[];
  return sortByOrder(cleaned);
};

const normalizeStats = (stats: unknown): HeroStat[] => {
  if (!Array.isArray(stats)) return [];
  const cleaned = stats
    .map((stat) => {
      if (!stat || typeof stat !== "object") return null;
      const label = (stat as HeroStat).label?.trim?.();
      const value = Number((stat as HeroStat).value);
      if (!label || Number.isNaN(value)) return null;
      return {
        _id: typeof (stat as HeroStat)._id === "string" ? (stat as HeroStat)._id : undefined,
        label,
        value,
        suffix: (stat as HeroStat).suffix?.trim?.() || "",
        icon: (stat as HeroStat).icon || "",
        order: parseOptionalNumber((stat as HeroStat).order),
      };
    })
    .filter(Boolean) as HeroStat[];
  return sortByOrder(cleaned);
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
    { label: "Join Now", href: "#enquiry", style: "primary", icon: "ArrowRight", order: 0, isExternal: false },
    { label: "Explore Courses", href: "#courses", style: "outline", icon: "Play", order: 1, isExternal: false },
  ],
  stats: [
    { label: "Students Trained", value: 5000, suffix: "+", icon: "Users", order: 0 },
    { label: "Courses", value: 15, suffix: "+", icon: "BookOpen", order: 1 },
    { label: "Placements", value: 2500, suffix: "+", icon: "Award", order: 2 },
    { label: "Avg Salary Hike", value: 85, suffix: "%", icon: "TrendingUp", order: 3 },
  ],
  images: [
    { url: "/images/hero-bg.jpg", alt: "Hero background 1", order: 0 },
    { url: "/images/Hero-bg2.jpeg", alt: "Hero background 2", order: 1 },
    { url: "/images/Hero-bg3.jpg", alt: "Hero background 3", order: 2 },
    { url: "/images/Hero-bg4.jpg", alt: "Hero background 4", order: 3 },
  ],
  scrollText: "Scroll",
  showScrollIndicator: true,
};

export const normalizeHeroSection = (hero?: Partial<HeroSectionData> | null): HeroSectionData => ({
  _id: typeof hero?._id === "string" ? hero._id : undefined,
  badgeText: hero?.badgeText?.trim?.() || fallbackHero.badgeText,
  title: hero?.title?.trim?.() || fallbackHero.title,
  highlightPrefix: hero?.highlightPrefix?.trim?.() || fallbackHero.highlightPrefix,
  highlightNumber: Number.isFinite(Number(hero?.highlightNumber))
    ? Number(hero?.highlightNumber)
    : fallbackHero.highlightNumber,
  highlightSuffix: hero?.highlightSuffix?.trim?.() || fallbackHero.highlightSuffix,
  description: hero?.description?.trim?.() || fallbackHero.description,
  animatedWords: Array.isArray(hero?.animatedWords) && hero?.animatedWords.length
    ? (hero?.animatedWords as string[]).filter(Boolean)
    : fallbackHero.animatedWords,
  buttons: normalizeButtons(hero?.buttons) || fallbackHero.buttons,
  stats: normalizeStats(hero?.stats) || fallbackHero.stats,
  images: normalizeImages(hero?.images) || fallbackHero.images,
  scrollText: hero?.scrollText?.trim?.() || fallbackHero.scrollText,
  showScrollIndicator:
    typeof hero?.showScrollIndicator === "boolean"
      ? hero.showScrollIndicator
      : fallbackHero.showScrollIndicator,
});

export const fetchHeroSection = async (): Promise<HeroSectionData> => {
  if (!API_BASE) {
    return fallbackHero;
  }

  const res = await fetch(`${API_BASE}/hero-section`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch hero section");
  const data = (await res.json()) as HeroResponse;
  return normalizeHeroSection(data?.hero);
};

export const broadcastHeroUpdate = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HERO_STORAGE_KEY, String(Date.now()));
};
