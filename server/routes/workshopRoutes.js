import express from "express";
import multer from "multer";
import authMiddleware from "../middlewares/authJWT.js";
import {
  getWorkshop,
  verifyParticipant,
  sendOtp,
  verifyOtp,
  checkWorkshopSession,
  downloadCertificate,
  listWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  uploadParticipants,
  listParticipants,
  deleteParticipant,
} from "../controllers/workshopController.js";

const router = express.Router();

// multer for CSV uploads (memory storage, csv/text only)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// ─── Public routes ────────────────────────────────────────────────────────────
router.get("/workshops/:slug", getWorkshop);
router.post("/workshops/:slug/verify-participant", verifyParticipant);
router.post("/workshops/:slug/send-otp", sendOtp);
router.post("/workshops/:slug/verify-otp", verifyOtp);
router.get("/workshops/:slug/session", checkWorkshopSession);
router.get("/workshops/:slug/certificate", downloadCertificate);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get(
  "/admin/workshops",
  authMiddleware("adminToken"),
  listWorkshops
);
router.post(
  "/admin/workshops",
  authMiddleware("adminToken"),
  createWorkshop
);
router.put(
  "/admin/workshops/:id",
  authMiddleware("adminToken"),
  updateWorkshop
);
router.delete(
  "/admin/workshops/:id",
  authMiddleware("adminToken"),
  deleteWorkshop
);
router.post(
  "/admin/workshops/:id/participants/upload",
  authMiddleware("adminToken"),
  csvUpload.single("file"),
  uploadParticipants
);
router.get(
  "/admin/workshops/:id/participants",
  authMiddleware("adminToken"),
  listParticipants
);
router.delete(
  "/admin/workshops/:id/participants/:participantId",
  authMiddleware("adminToken"),
  deleteParticipant
);

export default router;
