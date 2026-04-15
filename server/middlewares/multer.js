import multer from "multer";

const storage = multer.memoryStorage();

const pdfOnlyFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname?.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return cb(new Error("Only PDF files are allowed."));
  }

  cb(null, true);
};

export const fileArr = multer({ storage: storage }).any();
const careerResumeUploader = multer({
  storage,
  fileFilter: pdfOnlyFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  }).single("resume");

const linkedInPdfUploader = multer({
  storage,
  fileFilter: pdfOnlyFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
}).single("file");

export const careerResumeUpload = (req, res, next) => {
  careerResumeUploader(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message || "Invalid resume upload.",
      });
    }

    next();
  });
};

export const linkedInPdfUpload = (req, res, next) => {
  linkedInPdfUploader(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message || "Invalid LinkedIn PDF upload.",
      });
    }

    next();
  });
};
