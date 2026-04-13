import fs from "fs/promises";
import CareerApplication from "../models/careerApplicationModel.js";
import { sendJobApplicationEmails } from "../services/jobApplicationEmailService.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeField = (value) => (typeof value === "string" ? value.trim() : "");

const cleanupUploadedFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (_error) {
    // Ignore cleanup failures so they do not mask the real result.
  }
};

export const applyJob = async (req, res) => {
  const submittedAt = new Date();
  const candidateName = normalizeField(req.body.candidateName || req.body.name);
  const candidateEmail = normalizeField(req.body.candidateEmail || req.body.email).toLowerCase();
  const phone = normalizeField(req.body.phone);
  const jobTitle = normalizeField(req.body.jobTitle || req.body.position);
  const { file } = req;

  try {
    if (!candidateName || !candidateEmail || !phone || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "candidateName, candidateEmail, phone, and jobTitle are required.",
      });
    }

    if (!emailPattern.test(candidateEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid candidateEmail.",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required.",
      });
    }

    await sendJobApplicationEmails({
      candidateName,
      candidateEmail,
      phone,
      jobTitle,
      resumeFile: file,
      submittedAt,
    });

    await CareerApplication.create({
      candidateName,
      candidateEmail,
      phone,
      jobTitle,
      resumeOriginalName: file.originalname,
      resumeMimeType: file.mimetype,
      resumeSize: file.size,
    });

    return res.status(200).json({
      success: true,
      message: "Application submitted and emails sent successfully",
    });
  } catch (error) {
    console.error("applyJob error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit application or send emails.",
    });
  } finally {
    await cleanupUploadedFile(file?.path);
  }
};
