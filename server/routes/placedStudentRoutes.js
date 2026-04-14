import express from "express";
import {
  addPlacedStudent,
  deletePlacedStudent,
  getPlacedStudents,
  updatePlacedStudent,
  reorderPlacedStudents,
} from "../controllers/placedStudentController.js";
import authMiddleware from "../middlewares/authJWT.js";
import { placedStudentUpload } from "../middlewares/placedStudentUpload.js";

const router = express.Router();

// Public fetch
router.get("/", getPlacedStudents);

// Bulk reorder for drag-and-drop (must be before /:id routes)
router.put("/reorder", authMiddleware("adminToken"), reorderPlacedStudents);

// Admin-only mutations
router.post(
  "/",
  authMiddleware("adminToken"),
  placedStudentUpload.single("photo"),
  addPlacedStudent,
);

router.put(
  "/:id",
  authMiddleware("adminToken"),
  placedStudentUpload.single("photo"),
  updatePlacedStudent,
);

router.delete("/:id", authMiddleware("adminToken"), deletePlacedStudent);

export default router;
