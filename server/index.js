import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import studentRouter from "./routes/studentRouter.js";
import connectToDB from "./connection.js";
import loginRouter from "./routes/loginRouter.js";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import placedStudentRoutes from "./routes/placedStudentRoutes.js";
import successStoryRoutes from "./routes/successStoryRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dailyUpdateRoutes from "./routes/dailyUpdateRoutes.js";
import universalHeaderRoutes from "./routes/universalHeaderRoutes.js";
import heroSectionRoutes from "./routes/heroSectionRoutes.js";
import companiesSectionRoutes from "./routes/companiesSectionRoutes.js";
import engineeringTeamRoutes from "./routes/engineeringTeamRoutes.js";
import getInTouchRoutes from "./routes/getInTouchRoutes.js";
import footerRoutes from "./routes/footerRoutes.js";
import careerSectionRoutes from "./routes/careerSectionRoutes.js";
import jobApplicationRoutes from "./routes/jobApplicationRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_PATH,
      "http://localhost:8081",
      "https://registration-form-dev.onrender.com",
      "https://web.fullstacklearning.in",
      "https://www.fullstacklearning.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);
console.log(process.env.FRONTEND_PATH);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/static", express.static(join(__dirname, "uploads")));

try {
  await connectToDB();
} catch (error) {
  console.error("Unable to start server because MongoDB connection failed.");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});

app.get("/healthCheck", (req, res) => {
  res.send("Backend is working 🚀");
});
app.use("/api/students", studentRouter);
app.use("/api/auth", loginRouter);
app.use("/api/test", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/placed-students", placedStudentRoutes);
app.use("/api/success-stories", successStoryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/daily-updates", dailyUpdateRoutes);
app.use("/api/universal-header", universalHeaderRoutes);
app.use("/api/hero-section", heroSectionRoutes);
app.use("/api/companies-section", companiesSectionRoutes);
app.use("/api/engineering-team", engineeringTeamRoutes);
app.use("/api/get-in-touch", getInTouchRoutes);
app.use("/api/footer", footerRoutes);
app.use("/api/career-section", careerSectionRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api", workshopRoutes);
app.use("/", jobApplicationRoutes);
app.use("/api", jobApplicationRoutes);
