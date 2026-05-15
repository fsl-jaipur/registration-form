import { Bot, Code2, Database, Globe, Icon, Layers, Server, Smartphone } from "lucide-react";

export type SyllabusModule = {
  title: string;
  points: string[];
};

export type Course = {
  _id?: string;
  slug?: string;
  icon?: Icon;
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

export const courseIconMap: Record<string, Icon> = {
  layers: Layers,
  code2: Code2,
  server: Server,
  database: Database,
  globe: Globe,
  bot: Bot,
  smartphone: Smartphone,
};

export const getCourseIcon = (iconName?: string) =>
  courseIconMap[iconName?.toLowerCase?.() ?? ""] || Layers;

// Helper functions for syllabus handling
export const normalizeSyllabusModules = (syllabus?: string[] | SyllabusModule[]): SyllabusModule[] => {
  if (!syllabus || !Array.isArray(syllabus)) return [];
  
  // If it's already in new format
  if (syllabus.length > 0 && typeof syllabus[0] === 'object' && 'title' in syllabus[0]) {
    return syllabus as SyllabusModule[];
  }
  
  // Convert old format to new format
  return (syllabus as string[]).map(title => ({
    title,
    points: ["Hands-on exercises", "Mini-projects", "Quizzes & assessments", "Revision and Q&A"]
  }));
};

export const getSyllabusAsStrings = (syllabus?: string[] | SyllabusModule[]): string[] => {
  if (!syllabus || !Array.isArray(syllabus)) return [];
  
  // If it's already old format
  if (syllabus.length > 0 && typeof syllabus[0] === 'string') {
    return syllabus as string[];
  }
  
  // Convert new format to old format (just module titles)
  return (syllabus as SyllabusModule[]).map(module => module.title);
};

export const courses: Course[] = [
  {
    icon: Layers,
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
    color: "from-brand-blue to-brand-blue-dark",
    order: 1,
  },
  {
    icon: Code2,
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
    color: "from-brand-orange to-brand-orange-dark",
    order: 2,
  },
  {
    icon: Server,
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
    color: "from-brand-blue to-brand-orange",
    order: 3,
  },
  {
    icon: Database,
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
    color: "from-brand-blue-dark to-brand-blue",
    order: 4,
  },
  {
    icon: Bot,
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
    color: "from-brand-blue to-brand-orange",
    order: 5,
  },
  {
    icon: Globe,
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
    color: "from-brand-blue to-brand-orange",
    order: 6,
  },
];

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-");
}
