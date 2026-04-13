import Assignment from "../models/assignmentModel.js";
import { createTrelloCard } from "../services/trelloService.js";
import { cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";

const youTubeThumbnail = (link) => {
  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./, "");
    const idFromQuery = url.searchParams.get("v");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (idFromQuery) return `https://img.youtube.com/vi/${idFromQuery}/hqdefault.jpg`;
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/embed/")[1];
        return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
      }
    }
  } catch {
    return null;
  }
  return null;
};

const normalizeType = (type) =>
  type === "image_text" ? "image_text" : "video";

export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      assignmentType,
      videoLink,
      imageUrl,
      contentText,
      category,
    } = req.body;

    const normalizedType = normalizeType(assignmentType);

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    if (normalizedType === "video" && !videoLink?.trim()) {
      return res.status(400).json({ message: "Video link is required for video assignments." });
    }

    const uploadedImageUrl = req.file
      ? (await cloudinaryUpload([req.file]))?.[0]?.secure_url || null
      : null;
    const bodyImageUrl = imageUrl?.trim() || "";
    const finalImageUrl = uploadedImageUrl || bodyImageUrl || null;

    if (normalizedType === "image_text" && (!finalImageUrl || !contentText?.trim())) {
      return res.status(400).json({ message: "Image upload or image URL and text are required for image assignments." });
    }

    const thumb =
      normalizedType === "video"
        ? youTubeThumbnail(videoLink)
        : finalImageUrl;

    const assignment = await Assignment.create({
      title: title.trim(),
      assignmentType: normalizedType,
      videoLink: normalizedType === "video" ? videoLink.trim() : "",
      imageUrl: normalizedType === "image_text" ? finalImageUrl : null,
      contentText: normalizedType === "image_text" ? contentText.trim() : "",
      category: category?.trim() || "uncategorized",
      thumbnail: thumb,
    });

    try {
      const card = await createTrelloCard({
        title: assignment.title,
        assignmentType: assignment.assignmentType,
        videoLink: assignment.videoLink,
        imageUrl: assignment.imageUrl,
        contentText: assignment.contentText,
        category: assignment.category,
        thumbnail: assignment.thumbnail,
        assignmentId: assignment._id?.toString(),
      });

      if (card) {
        assignment.trelloCardId = card.id || null;
        assignment.trelloCardUrl = card.url || null;
        assignment.trelloCardShortUrl = card.shortUrl || null;
        await assignment.save();
      }
    } catch (trelloError) {
      console.error("Trello card creation failed:", trelloError.message || trelloError);
    }

    return res
      .status(201)
      .json({ message: "Assignment created successfully", assignment });
  } catch (error) {
    console.error("createAssignment error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create assignment", error: error.message });
  }
};

export const getAllAssignments = async (_req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    return res.status(200).json({ assignments });
  } catch (error) {
    console.error("getAllAssignments error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch assignments", error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      assignmentType,
      videoLink,
      imageUrl,
      contentText,
      category,
    } = req.body;

    const existing = await Assignment.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const nextType = assignmentType
      ? normalizeType(assignmentType)
      : existing.assignmentType || "video";

    const nextTitle = typeof title === "string" ? title.trim() : existing.title;
    const nextCategory =
      typeof category === "string"
        ? category.trim() || "uncategorized"
        : existing.category;

    const nextVideoLink =
      nextType === "video"
        ? typeof videoLink === "string"
          ? videoLink.trim()
          : existing.videoLink
        : "";

    const uploadedImageUrl = req.file
      ? (await cloudinaryUpload([req.file]))?.[0]?.secure_url || null
      : null;

    const nextImageUrl =
      nextType === "image_text"
        ? uploadedImageUrl ||
          (typeof imageUrl === "string" ? imageUrl.trim() : existing.imageUrl || "")
        : null;

    const nextContentText =
      nextType === "image_text"
        ? typeof contentText === "string"
          ? contentText.trim()
          : existing.contentText || ""
        : "";

    if (!nextTitle) {
      return res.status(400).json({ message: "Title is required." });
    }

    if (nextType === "video" && !nextVideoLink) {
      return res.status(400).json({ message: "Video link is required for video assignments." });
    }

    if (nextType === "image_text" && (!nextImageUrl || !nextContentText)) {
      return res.status(400).json({ message: "Image upload or image URL and text are required for image assignments." });
    }

    const nextThumbnail =
      nextType === "video"
        ? youTubeThumbnail(nextVideoLink)
        : nextImageUrl;

    existing.title = nextTitle;
    existing.assignmentType = nextType;
    existing.videoLink = nextVideoLink;
    existing.imageUrl = nextImageUrl;
    existing.contentText = nextContentText;
    existing.category = nextCategory;
    existing.thumbnail = nextThumbnail;

    await existing.save();

    return res.status(200).json({ message: "Assignment updated", assignment: existing });
  } catch (error) {
    console.error("updateAssignment error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update assignment", error: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    return res.status(200).json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("deleteAssignment error:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete assignment", error: error.message });
  }
};
