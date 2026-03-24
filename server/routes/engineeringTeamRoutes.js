import express from "express";
import authMiddleware from "../middlewares/authJWT.js";
import { engineeringTeamUpload } from "../middlewares/engineeringTeamUpload.js";
import {
  createMember,
  deleteMember,
  getTeam,
  updateMember,
} from "../controllers/engineeringTeamController.js";

const router = express.Router();

router.get("/", getTeam);
router.post("/", authMiddleware("adminToken"), engineeringTeamUpload.single("photo"), createMember);
router.put("/:id", authMiddleware("adminToken"), engineeringTeamUpload.single("photo"), updateMember);
router.delete("/:id", authMiddleware("adminToken"), deleteMember);

export default router;
