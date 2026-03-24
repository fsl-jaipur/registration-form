import EngineeringTeam, { defaultEngineeringTeam } from "../models/engineeringTeamModel.js";
import { cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";

const sortByOrder = (items = []) => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const numberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const getTeam = async (_req, res) => {
  try {
    let team = await EngineeringTeam.find().sort({ order: 1, createdAt: 1 });
    if (!team.length) {
      team = await EngineeringTeam.insertMany(defaultEngineeringTeam);
    }
    return res.status(200).json({ team });
  } catch (error) {
    console.error("getTeam error:", error);
    return res.status(500).json({ message: "Failed to fetch engineering team", error: error.message });
  }
};

export const createMember = async (req, res) => {
  try {
    let photo = req.body.photo?.trim?.();
    if (req.file) {
      const [upload] = await cloudinaryUpload([req.file]);
      photo = upload.secure_url;
    }
    if (!photo) {
      return res.status(400).json({ message: "Photo is required" });
    }
    const member = await EngineeringTeam.create({
      name: req.body.name?.trim(),
      title: req.body.title?.trim(),
      photo,
      order: numberOrUndefined(req.body.order),
      isVisible: req.body.isVisible === "false" ? false : true,
      social: {
        linkedin: req.body.linkedin?.trim(),
        github: req.body.github?.trim(),
      },
    });
    const team = await EngineeringTeam.find().sort({ order: 1, createdAt: 1 });
    return res.status(201).json({ message: "Member created", member, team });
  } catch (error) {
    console.error("createMember error:", error);
    return res.status(500).json({ message: "Failed to create member", error: error.message });
  }
};

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await EngineeringTeam.findById(id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    if (req.file) {
      const [upload] = await cloudinaryUpload([req.file]);
      member.photo = upload.secure_url;
    } else if (req.body.photo?.trim()) {
      member.photo = req.body.photo.trim();
    }

    if (req.body.name?.trim()) member.name = req.body.name.trim();
    if (req.body.title?.trim()) member.title = req.body.title.trim();
    if (req.body.linkedin?.trim() || req.body.github?.trim()) {
      member.social = {
        linkedin: req.body.linkedin?.trim() || member.social?.linkedin,
        github: req.body.github?.trim() || member.social?.github,
      };
    }
    if (req.body.order !== undefined) {
      const num = numberOrUndefined(req.body.order);
      member.order = num;
    }
    if (req.body.isVisible !== undefined) {
      const val = String(req.body.isVisible).toLowerCase();
      member.isVisible = !["false", "0", "off", "no"].includes(val);
    }

    await member.save();
    const team = await EngineeringTeam.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ message: "Member updated", member, team });
  } catch (error) {
    console.error("updateMember error:", error);
    return res.status(500).json({ message: "Failed to update member", error: error.message });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await EngineeringTeam.findByIdAndDelete(id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    const team = await EngineeringTeam.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ message: "Member deleted", team });
  } catch (error) {
    console.error("deleteMember error:", error);
    return res.status(500).json({ message: "Failed to delete member", error: error.message });
  }
};
