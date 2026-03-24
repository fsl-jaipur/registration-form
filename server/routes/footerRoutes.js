import express from "express";
import authMiddleware from "../middlewares/authJWT.js";
import {
  createFooter,
  deleteFooter,
  getFooter,
  updateFooter,
} from "../controllers/footerController.js";
import { universalHeaderUpload } from "../middlewares/universalHeaderUpload.js";

const router = express.Router();

router.get("/", getFooter);
router.post(
  "/",
  authMiddleware("adminToken"),
  universalHeaderUpload.single("logo"),
  createFooter,
);
router.put(
  "/:id",
  authMiddleware("adminToken"),
  universalHeaderUpload.single("logo"),
  updateFooter,
);
router.delete("/:id", authMiddleware("adminToken"), deleteFooter);

export default router;
