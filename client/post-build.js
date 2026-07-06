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

  // 1. Replace Title tag
  html = html.replace(/<title>[^<]+<\/title>/g, `<title>${meta.title}</title>`);

  // 2. Replace Open Graph (OG) Title
  if (html.includes('property="og:title"')) {
    html = html.replace(
      /<meta property="og:title" content="[^"]+" \/>/g,
      `<meta property="og:title" content="${meta.title}" />`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta property="og:title" content="${meta.title}" />\n</head>`
    );
  }

  // 3. Replace Twitter Title
  if (html.includes('name="twitter:title"')) {
    html = html.replace(
      /<meta name="twitter:title" content="[^"]+">/g,
      `<meta name="twitter:title" content="${meta.title}">`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta name="twitter:title" content="${meta.title}">\n</head>`
    );
  }

  // 4. Replace Open Graph (OG) Description
  if (html.includes('property="og:description"')) {
    html = html.replace(
      /<meta property="og:description" content="[^"]+" \/>/g,
      `<meta property="og:description" content="${meta.description}" />`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta property="og:description" content="${meta.description}" />\n</head>`
    );
  }

  // 5. Replace Twitter Description
  if (html.includes('name="twitter:description"')) {
    html = html.replace(
      /<meta name="twitter:description" content="[^"]+">/g,
      `<meta name="twitter:description" content="${meta.description}">`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <meta name="twitter:description" content="${meta.description}">\n</head>`
    );
  }

  // 6. Update URL if metadata includes URL matching
  const targetUrl = `https://www.fullstacklearning.com/${route}`;
  if (html.includes('property="og:url"')) {
    html = html.replace(
      /<meta property="og:url" content="[^"]+" \/>/g,
      `<meta property="og:url" content="${targetUrl}" />`
    );
  }

  fs.writeFileSync(path.join(pageDir, "index.html"), html, "utf8");
  console.log(`✓ Generated static page file: dist/${route}/index.html`);
}

console.log("[Post-Build] All static previews generated successfully!\n");
