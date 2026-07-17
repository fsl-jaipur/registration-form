import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("Error: dist/index.html not found! Please run your build first.");
  process.exit(1);
}

// Configuration for static preview pages
// Add any pages you want custom link previews (title, description, image, etc.) for.
const pages = {
  "register": {
    title: "Register | Full Stack Learning",
    description: "Register for Full Stack Learning courses. Master AI-powered Full Stack Development & Data Science with hands-on training.",
  },
  "login": {
    title: "Login | Full Stack Learning",
    description: "Access your Student Dashboard, view test scores, check assignments, and update daily status.",
  },
  "student/studentpanel": {
    title: "Student Panel | Full Stack Learning",
    description: "Access your active tests, assignments, daily updates, and results in your student area.",
  },
  "student/result": {
    title: "My Results | Full Stack Learning",
    description: "Check your scores and detailed question-wise analysis for attempted quizzes.",
  },
  "student/assignments": {
    title: "Assignments | Full Stack Learning",
    description: "Track and submit your course assignments and projects.",
  },
  "student/daily-updates": {
    title: "Daily Updates | Full Stack Learning",
    description: "Submit and view your daily project progress updates.",
  },
  "student/resumes": {
    title: "Resume Builder | Full Stack Learning",
    description: "Create, edit, and export your professional resume using templates and LinkedIn import.",
  },
  "courses": {
    title: "Our Courses | Full Stack Learning",
    description: "Explore our specialized courses in Full Stack, Frontend, Backend, Database, React Native, and DevOps.",
  },
  "courses/full-stack-development": {
    title: "Full Stack Development Course | Full Stack Learning",
    description: "Learn Web Development from basic HTML/CSS to advanced React, Node.js, Express, and MongoDB with live projects.",
  },
  "courses/frontend-development": {
    title: "Frontend Development Course | Full Stack Learning",
    description: "Master React, Vite, TypeScript, and modern UI design framework integration.",
  },
  "courses/backend-development": {
    title: "Backend Development Course | Full Stack Learning",
    description: "Master REST APIs, Node.js, authentication, and secure servers.",
  },
  "courses/database-management": {
    title: "Database Management Course | Full Stack Learning",
    description: "Master SQL databases and NoSQL databases like MongoDB and Redis.",
  },
  "courses/react-native-mobile": {
    title: "React Native Mobile App Development Course | Full Stack Learning",
    description: "Build cross-platform iOS and Android mobile apps from scratch.",
  },
  "courses/devops-cloud": {
    title: "DevOps & Cloud Computing Course | Full Stack Learning",
    description: "Learn CI/CD pipelines, Docker, Kubernetes, and cloud deployment on Azure & Render.",
  },
  "lifeatfsl": {
    title: "Life at FSL | Full Stack Learning",
    description: "Discover our classroom learning, hackathons, presentations, and interactive culture.",
  },
  "career": {
    title: "Careers | Full Stack Learning",
    description: "Join our engineering team or explore job opportunities with our hiring partners.",
  },
};

console.log("\n[Post-Build] Generating static previews for SPA routes...");

const baseHtml = fs.readFileSync(indexPath, "utf8");

for (const [route, meta] of Object.entries(pages)) {
  const pageDir = path.join(distPath, route);
  
  // Create nested directory if it doesn't exist
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  let html = baseHtml;

  // Remove existing title tags (both normal and commented out)
  html = html.replace(/<!--\s*<title>.*?<\/title>\s*-->/gis, "");
  html = html.replace(/<title>.*?<\/title>/gis, "");

  // Remove existing metadata (multi-line safe, property/name ordering safe)
  html = html.replace(/<meta\s+[^>]*property=["']og:title["'][^>]*>/gis, "");
  html = html.replace(/<meta\s+[^>]*name=["']twitter:title["'][^>]*>/gis, "");
  html = html.replace(/<meta\s+[^>]*property=["']og:description["'][^>]*>/gis, "");
  html = html.replace(/<meta\s+[^>]*name=["']twitter:description["'][^>]*>/gis, "");
  html = html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/gis, "");
  html = html.replace(/<meta\s+[^>]*property=["']og:url["'][^>]*>/gis, "");

  // Inject the new clean metadata tags
  const targetUrl = `https://www.fullstacklearning.com/${route}`;
  const newTags = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title}" />
    <meta name="twitter:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta name="twitter:description" content="${meta.description}" />
    <meta property="og:url" content="${targetUrl}" />`;

  html = html.replace(/<head>/i, `<head>${newTags}`);

  // 1. Save to dist/route/index.html (handles URLs with trailing slash like /register/)
  fs.writeFileSync(path.join(pageDir, "index.html"), html, "utf8");
  console.log(`✓ Generated static page file: dist/${route}/index.html`);

  // 2. Save to dist/route.html (handles URLs without trailing slash like /register)
  const flatFilePath = path.join(distPath, `${route}.html`);
  const flatFileParentDir = path.dirname(flatFilePath);
  if (!fs.existsSync(flatFileParentDir)) {
    fs.mkdirSync(flatFileParentDir, { recursive: true });
  }
  fs.writeFileSync(flatFilePath, html, "utf8");
  console.log(`✓ Generated static page file: dist/${route}.html`);
}

console.log("[Post-Build] All static previews generated successfully!\n");
