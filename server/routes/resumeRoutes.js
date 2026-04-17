import { Router } from "express";
import authMiddleware from "../middlewares/authJWT.js";
import {
  createResume,
  deleteResume,
  exportResumeJson,
  getLinkedInAuthUrl,
  getResumeBootstrap,
  getResumeById,
  getSharedResume,
  importLinkedInPdf,
  linkedInCallback,
  listAllResumes,
  listMyResumes,
  updateResume,
} from "../controllers/resumeController.js";
import { linkedInPdfUpload } from "../middlewares/multer.js";

const resumeRoutes = Router();

resumeRoutes.get("/share/:slug", getSharedResume);
resumeRoutes.get("/linkedin/callback", linkedInCallback);
resumeRoutes.get("/linkedin/auth-url", getLinkedInAuthUrl);
resumeRoutes.post(
  "/linkedin/pdf-import",
  linkedInPdfUpload,
  importLinkedInPdf
);
resumeRoutes.get("/bootstrap", authMiddleware("studentToken"), getResumeBootstrap);
resumeRoutes.get("/mine", authMiddleware("studentToken"), listMyResumes);
resumeRoutes.post("/", authMiddleware("studentToken"), createResume);
resumeRoutes.get("/admin/all", authMiddleware("adminToken"), listAllResumes);
resumeRoutes.get("/admin/export/:id", authMiddleware("adminToken"), exportResumeJson);
resumeRoutes.get("/:id", authMiddleware("adminToken", "studentToken"), getResumeById);
resumeRoutes.put("/:id", authMiddleware("adminToken", "studentToken"), updateResume);
resumeRoutes.delete("/:id", authMiddleware("studentToken"), deleteResume);

export default resumeRoutes;
