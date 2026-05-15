import { getApiBaseUrl } from "@shared/config/api";

export type SyllabusModule = {
  title: string;
  points: string[];
};

export type Course = {
  _id?: string;
  slug?: string;
  iconName?: string;
  title: string;
  duration?: string;
  students?: string;
  rating?: number;
  level?: string;
  tags?: string[];
  description?: string;
  overview?: string;
  fee?: string;
  // Support both old format (string[]) and new format (SyllabusModule[])
  syllabus?: string[] | SyllabusModule[];
  badge?: string | null;
  badgeColor?: string;
  color?: string;
  order?: number;
};

export const fallbackCourses: Course[] = [
  {
    iconName: "Layers",
    slug: "full-stack-development",
    title: "Full Stack Development",
    duration: "6 Months",
    students: "1200+",
    rating: 4.9,
    level: "Beginner to Advanced",
    tags: ["React", "Node.js", "MongoDB", "Express"],
    description: "Complete web development from frontend to backend. Build real-world projects with industry mentors.",
    overview:
      "A comprehensive program covering frontend, backend and deployment. Includes mentorship and real-world projects to build a production-ready portfolio.",
    fee: "Rs 45,000",
    syllabus: [
      "HTML, CSS, JavaScript, TypeScript",
      "React, State Management, Routing",
      "Node.js, Express, REST APIs",
      "Databases: MongoDB & SQL",
      "Authentication, Testing, Deployment",
    ],
    badge: "Most Popular",
    badgeColor: "bg-brand-orange",
    order: 1,
  },
  {
    iconName: "Code2",
    slug: "frontend-development",
    title: "Frontend Development",
    duration: "3 Months",
    students: "850+",
    rating: 4.8,
    level: "Beginner",
    tags: ["HTML", "CSS", "React", "Tailwind", "Figma"],
    description: "Master modern frontend technologies and create stunning, responsive user interfaces.",
    overview: "Focuses on building pixel-perfect UIs, accessibility and performance with modern tooling.",
    fee: "Rs 25,000",
    syllabus: ["HTML & CSS fundamentals", "Responsive layouts", "React & Hooks", "Tailwind & UI patterns"],
    badge: "Trending",
    badgeColor: "bg-brand-blue",
    order: 2,
  },
  {
    iconName: "Server",
    slug: "backend-development",
    title: "Backend Development",
    duration: "3 Months",
    students: "620+",
    rating: 4.7,
    level: "Intermediate",
    tags: ["Node.js", "Express", "REST API", "JWT", "C#"],
    description: "Build powerful server-side applications, APIs and handle databases like a pro.",
    overview: "Deep dive into server-side concepts, APIs, authentication and scalable architectures.",
    fee: "Rs 30,000",
    syllabus: ["Node.js & Express", "API design", "Authentication & Security", "Databases & ORMs"],
    badge: "New",
    badgeColor: "bg-green-500",
    order: 3,
  },
  {
    iconName: "Database",
    slug: "database-management",
    title: "Database Management",
    duration: "2 Months",
    students: "430+",
    rating: 4.6,
    level: "Beginner",
    tags: ["MySQL", "MongoDB", "PostgreSQL", "Redis"],
    description: "Learn SQL & NoSQL databases, query optimization and data modeling techniques.",
    overview: "Covers relational & non-relational databases, indexing, optimization and backup strategies.",
    fee: "Rs 18,000",
    syllabus: ["SQL fundamentals", "NoSQL concepts", "Indexing & Performance", "Backup & Replication"],
    badge: null,
    badgeColor: "",
    order: 4,
  },
  {
    iconName: "Bot",
    slug: "agentic-ai",
    title: "Agentic AI",
    duration: "3 Months",
    students: "220+",
    rating: 4.9,
    level: "Intermediate",
    tags: ["LLMs", "Agents", "Tools", "RAG"],
    description: "Build AI agents that plan, use tools, and automate real workflows.",
    overview:
      "Learn agent architectures, prompt design, tool integration, and safe deployment of AI systems.",
    fee: "Rs 40,000",
    syllabus: [
      "Prompting & LLM basics",
      "Agent architectures & planning",
      "Tool use & function calling",
      "RAG & knowledge integration",
      "Evaluation, safety, deployment",
    ],
    badge: "Trending",
    badgeColor: "bg-brand-blue",
    order: 5,
  },
  {
    iconName: "Globe",
    slug: "devops-cloud",
    title: "DevOps & Cloud",
    duration: "3 Months",
    students: "290+",
    rating: 4.7,
    level: "Advanced",
    tags: ["Docker", "AWS", "CI/CD", "Linux", "Terraform"],
    description: "Deploy and manage applications on cloud platforms with DevOps best practices.",
    overview: "Learn containerization, CI/CD pipelines and fundamentals of cloud providers for production deployments.",
    fee: "Rs 35,000",
    syllabus: ["Linux basics", "Docker & Containers", "CI/CD", "AWS fundamentals"],
    badge: null,
    badgeColor: "",
    order: 6,
  },
];

const sortByOrder = (items: Course[]) => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const normalizeSyllabus = (syllabus: any): SyllabusModule[] => {
  if (!syllabus || !Array.isArray(syllabus)) return [];
  
  // If it's already in new format (array of objects with title and points)
  if (syllabus.length > 0 && typeof syllabus[0] === 'object' && syllabus[0].title) {
    return syllabus.map((module: any) => ({
      title: module.title || '',
      points: Array.isArray(module.points) ? module.points : ["Hands-on exercises", "Mini-projects", "Quizzes & assessments", "Revision and Q&A"]
    }));
  }
  
  // Convert old format (string array) to new format
  const stringArray = Array.isArray(syllabus)
    ? syllabus
    : typeof syllabus === "string"
      ? syllabus.split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean)
      : [];

  return stringArray.map((title: string) => ({
    title: title || '',
    points: ["Hands-on exercises", "Mini-projects", "Quizzes & assessments", "Revision and Q&A"]
  }));
};

const normalizeCourse = (course: any = {}): Course => ({
  ...course,
  slug: course.slug || (course.title ? slugify(course.title) : undefined),
  tags: Array.isArray(course.tags)
    ? course.tags
    : typeof course.tags === "string"
      ? course.tags.split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean)
      : [],
  syllabus: normalizeSyllabus(course.syllabus),
  rating: course.rating ? Number(course.rating) : course.rating,
});

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export const fetchCourses = async (): Promise<Course[]> => {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return sortByOrder(fallbackCourses);
  }

  const res = await fetch(`${apiBase}/api/courses`);
  if (!res.ok) {
    throw new Error("Failed to fetch courses");
  }
  const json = await res.json();
  const courses = (json?.courses || []).map(normalizeCourse);
  return sortByOrder(courses);
};

export const fetchCourseBySlug = async (slug: string): Promise<Course | null> => {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return fallbackCourses.find((course) => (course.slug ?? "") === slug) ?? null;
  }

  const res = await fetch(`${apiBase}/api/courses/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Failed to fetch course");
  }
  const json = await res.json();
  return json?.course ? normalizeCourse(json.course) : null;
};

