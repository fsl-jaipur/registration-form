export type GetInTouchData = {
  _id?: string;
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

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

export const GET_IN_TOUCH_QUERY_KEY = ["get-in-touch"] as const;

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

const uniqueItems = (items: string[]) => {
  const seen = new Set<string>();

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

export const normalizeGetInTouchList = (value: unknown) => {
  if (Array.isArray(value)) {
    return uniqueItems(value.map((entry) => (typeof entry === "string" ? entry : String(entry ?? ""))));
  }

  if (typeof value === "string") {
    return uniqueItems(value.split(/[\n,]/));
  }

  return [];
};

const resolveArray = (value: unknown, fallback: string[]) =>
  value === undefined || value === null ? fallback : normalizeGetInTouchList(value);

export const normalizeGetInTouch = (section?: Partial<GetInTouchData> | null): GetInTouchData => ({
  _id: typeof section?._id === "string" ? section._id : undefined,
  badgeText: section?.badgeText?.trim() || fallbackGetInTouch.badgeText,
  heading: section?.heading?.trim() || fallbackGetInTouch.heading,
  highlight: section?.highlight?.trim() || fallbackGetInTouch.highlight,
  description: section?.description?.trim() || fallbackGetInTouch.description,
  phone: section?.phone?.trim() || fallbackGetInTouch.phone,
  email: section?.email?.trim() || fallbackGetInTouch.email,
  mapLink: section?.mapLink?.trim() || fallbackGetInTouch.mapLink,
  courses: resolveArray(section?.courses, fallbackGetInTouch.courses),
  highlights: resolveArray(section?.highlights, fallbackGetInTouch.highlights),
  formEndpoint: section?.formEndpoint?.trim() || fallbackGetInTouch.formEndpoint,
  accessKey: section?.accessKey?.trim() || fallbackGetInTouch.accessKey,
});

export const fetchGetInTouch = async (): Promise<GetInTouchData> => {
  if (!API_BASE) return fallbackGetInTouch;
  const res = await fetch(`${API_BASE}/get-in-touch`);
  if (!res.ok) throw new Error("Failed to fetch get in touch");
  const data = await res.json();
  return normalizeGetInTouch(data?.section);
};
