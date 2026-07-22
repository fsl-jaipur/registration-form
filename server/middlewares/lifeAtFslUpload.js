import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (_req, file, cb) => {
  if (!file || !file.mimetype || !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

export const lifeAtFslUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image limit
});
