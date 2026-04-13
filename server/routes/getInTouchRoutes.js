import express from "express";
import authMiddleware from "../middlewares/authJWT.js";
import {
  createGetInTouch,
  deleteGetInTouch,
  getGetInTouch,
  updateGetInTouch,
} from "../controllers/getInTouchController.js";

const router = express.Router();

router.get("/", getGetInTouch);
router.post("/", authMiddleware("adminToken"), createGetInTouch);
router.put("/:id", authMiddleware("adminToken"), updateGetInTouch);
router.delete("/:id", authMiddleware("adminToken"), deleteGetInTouch);

export default router;
