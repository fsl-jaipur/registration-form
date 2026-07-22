import express from "express";
import {
  getLifeAtFslImages,
  uploadLifeAtFslImages,
  deleteLifeAtFslImage,
  reorderLifeAtFslImages,
  updateLifeAtFslImage,
} from "../controllers/lifeAtFslController.js";
import authMiddleware from "../middlewares/authJWT.js";
import { lifeAtFslUpload } from "../middlewares/lifeAtFslUpload.js";

const router = express.Router();

// Public route
router.get("/", getLifeAtFslImages);

// Admin routes
router.put("/reorder", authMiddleware("adminToken"), reorderLifeAtFslImages);

router.post(
  "/",
  authMiddleware("adminToken"),
  lifeAtFslUpload.array("images", 30),
  uploadLifeAtFslImages
);

router.put(
  "/:id",
  authMiddleware("adminToken"),
  lifeAtFslUpload.single("image"),
  updateLifeAtFslImage
);

router.delete("/:id", authMiddleware("adminToken"), deleteLifeAtFslImage);

export default router;
