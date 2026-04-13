import express from "express";
import authMiddleware from "../middlewares/authJWT.js";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourseBySlug,
  getCourses,
  updateCourse,
} from "../controllers/courseController.js";

const router = express.Router();

router.get("/", getCourses);
router.get("/id/:id", authMiddleware("adminToken"), getCourseById);
router.get("/:slug", getCourseBySlug);
router.post("/", authMiddleware("adminToken"), createCourse);
router.put("/:id", authMiddleware("adminToken"), updateCourse);
router.delete("/:id", authMiddleware("adminToken"), deleteCourse);

export default router;
