import express from "express";
import {
  createAssignment,
  deleteAssignment,
  getAllAssignments,
  updateAssignment,
} from "../controllers/assignmentController.js";
import authMiddleware from "../middlewares/authJWT.js";
import { assignmentUpload } from "../middlewares/assignmentUpload.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware("adminToken"),
  assignmentUpload.single("imageFile"),
  createAssignment,
);

router.put(
  "/:id",
  authMiddleware("adminToken"),
  assignmentUpload.single("imageFile"),
  updateAssignment,
);

router.delete("/:id", authMiddleware("adminToken"), deleteAssignment);

router.get("/", authMiddleware("adminToken", "studentToken"), getAllAssignments);

export default router;
