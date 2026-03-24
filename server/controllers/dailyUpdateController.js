import DailyUpdate from "../models/dailyUpdateModel.js";
import studentModel from "../models/studentModel.js";
import adminModel from "../models/adminModel.js";
import { createDailyUpdateCard, moveCardToList } from "../services/trelloService.js";

const formatDateLabel = (date = new Date()) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const resolveStatusListId = (status) => {
  const map = {
    todo: process.env.TRELLO_TODO_LIST_ID || process.env.TRELLO_DAILY_LIST_ID,
    doing: process.env.TRELLO_DOING_LIST_ID,
    done: process.env.TRELLO_DONE_LIST_ID,
  };
  return map[status] || null;
};

export const createDailyUpdate = async (req, res) => {
  try {
    const message = req.body?.message?.trim();
    if (!message) {
      return res.status(400).json({ message: "Update message is required." });
    }

    const decoded = req.firstTimeSignin || {};
    const role = decoded.role || (decoded.adminId ? "admin" : "student");

    let authorName = role === "admin" ? "Admin" : "Student";
    let authorEmail = "";
    let authorPhone = "";
    let authorId = null;

    if (role === "student" && decoded.id) {
      const student = await studentModel.findById(decoded.id).select("name email phone");
      authorName = student?.name || student?.email || "Student";
      authorEmail = student?.email || "";
      authorPhone = student?.phone || "";
      authorId = student?._id ?? null;
    }

    if (role === "admin" && decoded.adminId) {
      const admin = await adminModel.findById(decoded.adminId).select("email");
      authorName = admin?.email || "Admin";
      authorEmail = admin?.email || "";
      authorId = admin?._id ?? null;
    }

    const title = `Daily Update - ${authorName} - ${formatDateLabel()}`;
    const description = [
      `Name: ${authorName}`,
      authorEmail ? `Email: ${authorEmail}` : null,
      authorPhone ? `Phone: ${authorPhone}` : null,
      `Role: ${role}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    let trelloCard = null;
    try {
      trelloCard = await createDailyUpdateCard({ title, description });
    } catch (trelloError) {
      console.error("Trello daily update card failed:", trelloError.message || trelloError);
    }

    const update = await DailyUpdate.create({
      authorRole: role,
      authorId,
      authorName,
      authorEmail,
      authorPhone,
      message,
      trelloCardId: trelloCard?.id || null,
      trelloCardUrl: trelloCard?.url || null,
      trelloCardShortUrl: trelloCard?.shortUrl || null,
      status: "todo",
    });

    return res.status(201).json({ message: "Daily update posted", update });
  } catch (error) {
    console.error("createDailyUpdate error:", error);
    return res
      .status(500)
      .json({ message: "Failed to post daily update", error: error.message });
  }
};

export const updateDailyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body?.status?.trim();

    if (!["todo", "doing", "done"].includes(status)) {
      return res.status(400).json({ message: "Status must be todo, doing, or done." });
    }

    const update = await DailyUpdate.findById(id);
    if (!update) {
      return res.status(404).json({ message: "Daily update not found" });
    }

    const listId = resolveStatusListId(status);
    if (!listId) {
      return res.status(400).json({
        message: "Missing list ID for this status. Set TRELLO_TODO_LIST_ID/TRELLO_DOING_LIST_ID/TRELLO_DONE_LIST_ID.",
      });
    }

    if (!update.trelloCardId) {
      return res.status(400).json({ message: "No Trello card exists for this update." });
    }

    await moveCardToList({ cardId: update.trelloCardId, listId });

    update.status = status;
    await update.save();

    return res.status(200).json({ message: "Status updated", update });
  } catch (error) {
    console.error("updateDailyStatus error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

export const getAllDailyUpdates = async (_req, res) => {
  try {
    const updates = await DailyUpdate.find().sort({ createdAt: -1 });
    return res.status(200).json({ updates });
  } catch (error) {
    console.error("getAllDailyUpdates error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch daily updates", error: error.message });
  }
};

export const getMyDailyUpdates = async (req, res) => {
  try {
    const decoded = req.firstTimeSignin || {};
    if (!decoded.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const updates = await DailyUpdate.find({ authorId: decoded.id }).sort({ createdAt: -1 });
    return res.status(200).json({ updates });
  } catch (error) {
    console.error("getMyDailyUpdates error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch daily updates", error: error.message });
  }
};
