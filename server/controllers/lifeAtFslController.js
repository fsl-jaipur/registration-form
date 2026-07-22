import LifeAtFslImage from "../models/lifeAtFslModel.js";
import { cloudinary, cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";

// Fetch all gallery images sorted by order ascending and createdAt descending
export const getLifeAtFslImages = async (_req, res) => {
  try {
    const images = await LifeAtFslImage.find().sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ images });
  } catch (error) {
    console.error("getLifeAtFslImages error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch gallery images", error: error.message });
  }
};

// Upload multiple or single image to Cloudinary and save to DB
export const uploadLifeAtFslImages = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No image files provided for upload." });
    }

    // Upload to Cloudinary
    const uploadResults = await cloudinaryUpload(files);

    // Find current max order to append new images at the end
    const maxOrderItem = await LifeAtFslImage.findOne().sort({ order: -1 });
    let startOrder = maxOrderItem ? maxOrderItem.order : 0;

    const newImages = [];
    for (const result of uploadResults) {
      startOrder += 1;
      const newImage = await LifeAtFslImage.create({
        imageUrl: result.secure_url,
        publicId: result.public_id,
        order: startOrder,
      });
      newImages.push(newImage);
    }

    return res.status(201).json({
      message: `${newImages.length} image(s) uploaded successfully`,
      images: newImages,
    });
  } catch (error) {
    console.error("uploadLifeAtFslImages error:", error);
    return res
      .status(500)
      .json({ message: "Failed to upload gallery images", error: error.message });
  }
};

// Delete single image from Cloudinary and DB
export const deleteLifeAtFslImage = async (req, res) => {
  try {
    const { id } = req.params;

    const imageDoc = await LifeAtFslImage.findById(id);
    if (!imageDoc) {
      return res.status(404).json({ message: "Gallery image not found" });
    }

    // Remove from Cloudinary if publicId exists
    if (imageDoc.publicId) {
      try {
        await cloudinary.uploader.destroy(imageDoc.publicId);
      } catch (cloudinaryError) {
        console.error("Failed to delete image from Cloudinary:", cloudinaryError);
      }
    }

    await LifeAtFslImage.findByIdAndDelete(id);

    return res.status(200).json({ message: "Gallery image deleted successfully" });
  } catch (error) {
    console.error("deleteLifeAtFslImage error:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete gallery image", error: error.message });
  }
};

// Reorder gallery images bulk update
export const reorderLifeAtFslImages = async (req, res) => {
  try {
    const { imageIds } = req.body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ message: "imageIds array is required for reordering" });
    }

    const updatePromises = imageIds.map((id, index) =>
      LifeAtFslImage.findByIdAndUpdate(id, { order: index + 1 }, { new: true })
    );

    const updatedImages = await Promise.all(updatePromises);
    const validImages = updatedImages.filter((img) => img !== null);

    return res.status(200).json({
      message: "Images reordered successfully",
      images: validImages,
    });
  } catch (error) {
    console.error("reorderLifeAtFslImages error:", error);
    return res
      .status(500)
      .json({ message: "Failed to reorder images", error: error.message });
  }
};

// Single image update (order or file replacement)
export const updateLifeAtFslImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body;

    const imageDoc = await LifeAtFslImage.findById(id);
    if (!imageDoc) {
      return res.status(404).json({ message: "Gallery image not found" });
    }

    const updateData = {};

    if (order !== undefined) {
      updateData.order = Number(order);
    }

    if (req.file) {
      // Remove old image from Cloudinary
      if (imageDoc.publicId) {
        try {
          await cloudinary.uploader.destroy(imageDoc.publicId);
        } catch (err) {
          console.error("Cloudinary cleanup error during update:", err);
        }
      }

      const [uploadResult] = await cloudinaryUpload([req.file]);
      updateData.imageUrl = uploadResult.secure_url;
      updateData.publicId = uploadResult.public_id;
    }

    const updatedImage = await LifeAtFslImage.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      message: "Gallery image updated successfully",
      image: updatedImage,
    });
  } catch (error) {
    console.error("updateLifeAtFslImage error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update image", error: error.message });
  }
};
