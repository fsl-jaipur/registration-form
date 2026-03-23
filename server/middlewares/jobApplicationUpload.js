import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.join(__dirname, "..", "uploads", "job-applications");

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

const ensureUploadDirectory = () => {
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }
};

const sanitizeFilename = (filename) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDirectory();
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const basename = path.basename(file.originalname || "resume", extension);
    const safeName = sanitizeFilename(basename) || "resume";
    cb(null, `${Date.now()}-${safeName}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const hasValidMimeType = allowedMimeTypes.has(file.mimetype);
  const hasValidExtension = allowedExtensions.has(extension);

  if (!hasValidMimeType || !hasValidExtension) {
    return cb(new Error("Only PDF, DOC, and DOCX files are allowed."));
  }

  cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("resume");

export const jobApplicationUpload = (req, res, next) => {
  uploader(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Resume file size must be 5MB or smaller."
          : error.message;

      return res.status(400).json({ success: false, message });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to upload resume.",
    });
  });
};

export { uploadDirectory };
