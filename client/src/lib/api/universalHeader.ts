import { parseOptionalNumber } from "@/lib/utils";

export type UniversalHeaderNavItem = {
  _id?: string;
  label: string;
  href: string;
  order?: number;
  isExternal: boolean;
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
};

type UniversalHeaderResponse = {
  header?: Partial<UniversalHeaderData> | null;
};

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export const UNIVERSAL_HEADER_QUERY_KEY = ["universal-header"] as const;
export const UNIVERSAL_HEADER_STORAGE_KEY = "fsl_universal_header_updated_at";

export const fallbackUniversalHeader: UniversalHeaderData = {
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
};

const sortByOrder = <T extends { order?: number }>(items: T[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const normalizePath = (value: string) => {
  if (!value) return value;
  return value.startsWith("/") || value.startsWith("#") ? value : `/${value}`;
};

export const resolveUniversalHeaderAsset = (src?: string | null) => {
  if (!src) return fallbackUniversalHeader.logo;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) {
    return src;
  }
  return normalizePath(src);
};

const normalizeNavItems = (
  navItems: unknown,
  fallback: UniversalHeaderNavItem[],
): UniversalHeaderNavItem[] => {
  if (!Array.isArray(navItems)) {
    return sortByOrder(fallback);
  }

  const cleaned = navItems
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label =
        typeof (item as UniversalHeaderNavItem).label === "string"
          ? (item as UniversalHeaderNavItem).label.trim()
          : "";
      const href =
        typeof (item as UniversalHeaderNavItem).href === "string"
          ? (item as UniversalHeaderNavItem).href.trim()
          : "";

      if (!label || !href) return null;

      return {
        _id:
          typeof (item as UniversalHeaderNavItem)._id === "string"
            ? (item as UniversalHeaderNavItem)._id
            : undefined,
        label,
        href,
        order: parseOptionalNumber((item as UniversalHeaderNavItem).order),
        isExternal: Boolean((item as UniversalHeaderNavItem).isExternal),
      };
    })
    .filter((item): item is UniversalHeaderNavItem => Boolean(item));

  return cleaned.length ? sortByOrder(cleaned) : sortByOrder(fallback);
};

const normalizeButtons = (
  buttons: unknown,
  fallback: UniversalHeaderButton[],
): UniversalHeaderButton[] => {
  if (!Array.isArray(buttons)) {
    return sortByOrder(fallback);
  }

  const cleaned = buttons
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label =
        typeof (item as UniversalHeaderButton).label === "string"
          ? (item as UniversalHeaderButton).label.trim()
          : "";
      const href =
        typeof (item as UniversalHeaderButton).href === "string"
          ? (item as UniversalHeaderButton).href.trim()
          : "";
      const style = (item as UniversalHeaderButton).style;

      if (!label || !href) return null;

      return {
        _id:
          typeof (item as UniversalHeaderButton)._id === "string"
            ? (item as UniversalHeaderButton)._id
            : undefined,
        label,
        href,
        style: style === "secondary" || style === "outline" ? style : "primary",
        order: parseOptionalNumber((item as UniversalHeaderButton).order),
      };
    })
    .filter((item): item is UniversalHeaderButton => Boolean(item));

  return cleaned.length ? sortByOrder(cleaned) : sortByOrder(fallback);
};

export const normalizeUniversalHeader = (
  header?: Partial<UniversalHeaderData> | null,
): UniversalHeaderData => ({
  _id: typeof header?._id === "string" ? header._id : undefined,
  logo: resolveUniversalHeaderAsset(
    typeof header?.logo === "string" ? header.logo.trim() : fallbackUniversalHeader.logo,
  ),
  logoAlt:
    typeof header?.logoAlt === "string" && header.logoAlt.trim()
      ? header.logoAlt.trim()
      : fallbackUniversalHeader.logoAlt,
  navItems: normalizeNavItems(header?.navItems, fallbackUniversalHeader.navItems),
  buttons: normalizeButtons(header?.buttons, fallbackUniversalHeader.buttons),
});

export const fetchUniversalHeader = async (): Promise<UniversalHeaderData> => {
  if (!API_BASE) {
    return fallbackUniversalHeader;
  }

  const res = await fetch(`${API_BASE}/universal-header`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch universal header");
  }

  const json = (await res.json()) as UniversalHeaderResponse;
  return normalizeUniversalHeader(json?.header);
};

export const broadcastUniversalHeaderUpdate = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UNIVERSAL_HEADER_STORAGE_KEY, String(Date.now()));
};
