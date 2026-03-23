import { parseOptionalNumber } from "@/lib/utils";

export type EngineeringMember = {
  _id?: string;
  name: string;
  title: string;
  photo: string;
  order?: number;
  isVisible?: boolean;
  social?: {
    linkedin?: string;
    github?: string;
  };
};

export const ENGINEERING_TEAM_QUERY_KEY = ["engineering-team"] as const;
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

const sortByOrder = (items: EngineeringMember[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const fallbackEngineeringTeam: EngineeringMember[] = [
  { name: "Rohit Jain", title: "Founder & CEO", photo: "/images/employees/rohit.jpg", order: 0 },
  { name: "Akshat Sharma", title: "Frontend Lead", photo: "/images/employees/akshat.jpeg", order: 1 },
  { name: "Dheeraj Jangid", title: "DevOps Engineer", photo: "/images/employees/dheeraj.jpg", order: 2 },
  { name: "Anant Tiwari", title: "Backend Engineer", photo: "/images/employees/anant.jpg", order: 3 },
];

const normalizeMembers = (members: unknown): EngineeringMember[] => {
  if (!Array.isArray(members)) return fallbackEngineeringTeam;
  const cleaned = members
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const name = (m as EngineeringMember).name?.trim?.();
      const title = (m as EngineeringMember).title?.trim?.();
      const photo = (m as EngineeringMember).photo?.trim?.();
      if (!name || !title || !photo) return null;
      return {
        _id: typeof (m as EngineeringMember)._id === "string" ? (m as EngineeringMember)._id : undefined,
        name,
        title,
        photo,
        order: parseOptionalNumber((m as EngineeringMember).order),
        isVisible: (m as EngineeringMember).isVisible !== false,
        social: (m as EngineeringMember).social || {},
      };
    })
    .filter(Boolean) as EngineeringMember[];
  return cleaned.length ? sortByOrder(cleaned) : fallbackEngineeringTeam;
};

export const fetchEngineeringTeam = async (): Promise<EngineeringMember[]> => {
  if (!API_BASE) {
    return fallbackEngineeringTeam;
  }
  const res = await fetch(`${API_BASE}/engineering-team`);
  if (!res.ok) throw new Error("Failed to fetch engineering team");
  const data = await res.json();
  return normalizeMembers(data?.team);
};
