import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function cloudinaryUpload(files) {
  if (!files || !Array.isArray(files)) {
    throw new Error("Files must be an array");
  }

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) return reject(error);
              resolve({ fieldname: file.fieldname, ...result });
            }
          );
          stream.end(file.buffer);
        })
    )
  );
}
