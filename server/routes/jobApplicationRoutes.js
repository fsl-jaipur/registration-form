import express from "express";
import { applyJob } from "../controllers/jobApplicationController.js";
import { jobApplicationUpload } from "../middlewares/jobApplicationUpload.js";

const router = express.Router();

router.post("/apply-job", jobApplicationUpload, applyJob);

export default router;
