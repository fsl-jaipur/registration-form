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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8085;
const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_PATH, "http://localhost:8081","https://registration-form-dev.onrender.com","https://web.fullstacklearning.in"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
console.log(process.env.FRONTEND_PATH);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/static", express.static(join(__dirname, "uploads")));

await connectToDB();

app.listen(PORT, () => console.log("Server started at port " + PORT));

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
