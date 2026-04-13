import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (_req, file, cb) => {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"), false);
  }
  cb(null, true);
};

export const heroSectionUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
}).array("images", 10);
