import express from "express";
import {
  createHeroSection,
  deleteHeroSection,
  getHeroSection,
  updateHeroSection,
} from "../controllers/heroSectionController.js";
import authMiddleware from "../middlewares/authJWT.js";
import { heroSectionUpload } from "../middlewares/heroSectionUpload.js";

const router = express.Router();

router.get("/", getHeroSection);

router.post("/", authMiddleware("adminToken"), heroSectionUpload, createHeroSection);

router.put("/:id", authMiddleware("adminToken"), heroSectionUpload, updateHeroSection);

router.delete("/:id", authMiddleware("adminToken"), deleteHeroSection);

export default router;
