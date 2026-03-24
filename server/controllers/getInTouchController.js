import GetInTouch from "../models/getInTouchModel.js";

const uniqueItems = (items = []) => {
  const seen = new Set();

  return items
    .map((item) => item?.trim?.() || "")
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const normalizeBodyArray = (value) => {
  if (Array.isArray(value)) return uniqueItems(value);
  if (typeof value === "string") {
    return uniqueItems(value.split(/[\n,]/));
  }
  return undefined;
};

export const getGetInTouch = async (_req, res) => {
  try {
    let section = await GetInTouch.findOne().sort({ updatedAt: -1 });
    if (!section) {
      section = await GetInTouch.create({});
    }
    return res.status(200).json({ section });
  } catch (error) {
    console.error("getGetInTouch error:", error);
    return res.status(500).json({ message: "Failed to fetch section", error: error.message });
  }
};

export const createGetInTouch = async (req, res) => {
  try {
    const existing = await GetInTouch.findOne();
    if (existing) {
      return res.status(400).json({ message: "Section already exists. Use update instead.", section: existing });
    }

    const section = await GetInTouch.create({
      badgeText: req.body.badgeText?.trim() || undefined,
      heading: req.body.heading?.trim() || undefined,
      highlight: req.body.highlight?.trim() || undefined,
      description: req.body.description?.trim() || undefined,
      phone: req.body.phone?.trim() || undefined,
      email: req.body.email?.trim() || undefined,
      mapLink: req.body.mapLink?.trim() || undefined,
      formEndpoint: req.body.formEndpoint?.trim() || undefined,
      accessKey: req.body.accessKey?.trim() || undefined,
      courses: normalizeBodyArray(req.body.courses),
      highlights: normalizeBodyArray(req.body.highlights),
    });

    return res.status(201).json({ message: "Section created", section });
  } catch (error) {
    console.error("createGetInTouch error:", error);
    return res.status(500).json({ message: "Failed to create section", error: error.message });
  }
};

export const updateGetInTouch = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await GetInTouch.findById(id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    const fields = [
      "badgeText",
      "heading",
      "highlight",
      "description",
      "phone",
      "email",
      "mapLink",
      "formEndpoint",
      "accessKey",
    ];

    fields.forEach((field) => {
      if (req.body[field]?.trim()) {
        section[field] = req.body[field].trim();
      }
    });

    const courses = normalizeBodyArray(req.body.courses);
    if (courses !== undefined) section.courses = courses;

    const highlights = normalizeBodyArray(req.body.highlights);
    if (highlights !== undefined) section.highlights = highlights;

    await section.save();
    return res.status(200).json({ message: "Section updated", section });
  } catch (error) {
    console.error("updateGetInTouch error:", error);
    return res.status(500).json({ message: "Failed to update section", error: error.message });
  }
};

export const deleteGetInTouch = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await GetInTouch.findByIdAndDelete(id);
    if (!section) return res.status(404).json({ message: "Section not found" });
    return res.status(200).json({ message: "Section deleted" });
  } catch (error) {
    console.error("deleteGetInTouch error:", error);
    return res.status(500).json({ message: "Failed to delete section", error: error.message });
  }
};
