import express from "express";
import authMiddleware from "../middlewares/authJWT.js";
import {
  createDailyUpdate,
  getAllDailyUpdates,
  getMyDailyUpdates,
  updateDailyStatus,
} from "../controllers/dailyUpdateController.js";

const router = express.Router();

router.post("/", authMiddleware("adminToken", "studentToken"), createDailyUpdate);
router.get("/me", authMiddleware("studentToken"), getMyDailyUpdates);
router.get("/", authMiddleware("adminToken"), getAllDailyUpdates);
router.patch("/:id/status", authMiddleware("adminToken"), updateDailyStatus);

export default router;
