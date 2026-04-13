import express from "express";
import authMiddleware from "../middlewares/authJWT.js";
import {
  createCareerSection,
  deleteCareerSection,
  getCareerSection,
  updateCareerSection,
} from "../controllers/careerSectionController.js";

const router = express.Router();

router.get("/", getCareerSection);
router.post("/", authMiddleware("adminToken"), createCareerSection);
router.put("/:id", authMiddleware("adminToken"), updateCareerSection);
router.delete("/:id", authMiddleware("adminToken"), deleteCareerSection);

export default router;
