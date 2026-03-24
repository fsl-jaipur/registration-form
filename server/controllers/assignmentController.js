import Assignment from "../models/assignmentModel.js";
import { createTrelloCard } from "../services/trelloService.js";

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

export const createAssignment = async (req, res) => {
  try {
    const { title, videoLink, category } = req.body;

    if (!title?.trim() || !videoLink?.trim()) {
      return res.status(400).json({ message: "Title and video link are required." });
    }

    const thumb = youTubeThumbnail(videoLink);

    const assignment = await Assignment.create({
      title: title.trim(),
      videoLink: videoLink.trim(),
      category: category?.trim() || "uncategorized",
      thumbnail: thumb,
    });

    try {
      const card = await createTrelloCard({
        title: assignment.title,
        videoLink: assignment.videoLink,
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
    const { title, videoLink, category } = req.body;
    const update = {};
    if (title) update.title = title.trim();
    if (videoLink) {
      update.videoLink = videoLink.trim();
      const thumb = youTubeThumbnail(videoLink);
      update.thumbnail = thumb;
    }
    if (category) update.category = category.trim();

    const assignment = await Assignment.findByIdAndUpdate(id, update, { new: true });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    return res.status(200).json({ message: "Assignment updated", assignment });
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
