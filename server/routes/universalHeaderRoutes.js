import express from "express";
import {
  addButton,
  addNavItem,
  createUniversalHeader,
  deleteButton,
  deleteNavItem,
  deleteUniversalHeader,
  getUniversalHeader,
  updateButton,
  updateNavItem,
  updateUniversalHeader,
} from "../controllers/universalHeaderController.js";
import authMiddleware from "../middlewares/authJWT.js";
import { universalHeaderUpload } from "../middlewares/universalHeaderUpload.js";

const router = express.Router();

router.get("/", getUniversalHeader);

router.post(
  "/",
  authMiddleware("adminToken"),
  universalHeaderUpload.single("logo"),
  createUniversalHeader,
);

router.put(
  "/:id",
  authMiddleware("adminToken"),
  universalHeaderUpload.single("logo"),
  updateUniversalHeader,
);

router.delete("/:id", authMiddleware("adminToken"), deleteUniversalHeader);

router.post("/:id/nav-items", authMiddleware("adminToken"), addNavItem);
router.put("/:id/nav-items/:itemId", authMiddleware("adminToken"), updateNavItem);
router.delete("/:id/nav-items/:itemId", authMiddleware("adminToken"), deleteNavItem);

router.post("/:id/buttons", authMiddleware("adminToken"), addButton);
router.put("/:id/buttons/:buttonId", authMiddleware("adminToken"), updateButton);
router.delete("/:id/buttons/:buttonId", authMiddleware("adminToken"), deleteButton);

export default router;
