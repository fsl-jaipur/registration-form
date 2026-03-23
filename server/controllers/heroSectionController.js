import HeroSection, {
  defaultHeroButtons,
  defaultHeroImages,
  defaultHeroStats,
  defaultHeroWords,
} from "../models/heroSectionModel.js";
import { cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";

const parseJsonField = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_error) {
      return undefined;
    }
  }
  return value;
};

const sanitizeStringArray = (value, { allowEmpty = false } = {}) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;

  const cleaned = parsed
    .map((item) => (typeof item === "string" ? item.trim() : null))
    .filter((item) => item);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};

const numberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const allowedButtonStyles = ["primary", "secondary", "outline", "ghost"];
const sanitizeButtons = (value, { allowEmpty = false } = {}) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;

  const cleaned = parsed
    .map((item) => {
      if (!item) return null;
      const label = item.label?.trim();
      const href = item.href?.trim();
      if (!label || !href) return null;
      const style = item.style?.trim();
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        label,
        href,
        style: allowedButtonStyles.includes(style) ? style : "primary",
        icon: item.icon?.trim() || "",
        isExternal: Boolean(item.isExternal),
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};

const sanitizeStats = (value, { allowEmpty = false } = {}) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;

  const cleaned = parsed
    .map((item) => {
      if (!item) return null;
      const label = item.label?.trim();
      const numericValue = numberOrUndefined(item.value);
      if (!label || numericValue === undefined) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        label,
        value: numericValue,
        suffix: item.suffix?.trim() || "",
        icon: item.icon?.trim() || "",
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};

const sanitizeImages = (value, { allowEmpty = false } = {}) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;

  const cleaned = parsed
    .map((item) => {
      if (!item) return null;
      const url = item.url?.trim();
      if (!url) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        url,
        alt: item.alt?.trim() || "",
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};
const booleanOrUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return undefined;
};

const uploadImagesIfAny = async (files = [], existingCount = 0, reqBody = {}) => {
  if (!files.length) return [];
  const uploads = await cloudinaryUpload(files);
  return uploads.map((uploadResult, idx) => {
    const altKey = `imageAlt${idx}`;
    const orderKey = `imageOrder${idx}`;
    const alt = reqBody?.[altKey]?.trim?.() || uploadResult.original_filename || "Hero image";
    const providedOrder = numberOrUndefined(reqBody?.[orderKey]);
    return {
      url: uploadResult.secure_url,
      alt,
      order: providedOrder !== undefined ? providedOrder : existingCount + idx,
    };
  });
};

export const getHeroSection = async (_req, res) => {
  try {
    let hero = await HeroSection.findOne().sort({ updatedAt: -1 });

    if (!hero) {
      hero = await HeroSection.create({
        images: defaultHeroImages.map((img) => ({ ...img })),
        animatedWords: defaultHeroWords.map((word) => word),
        buttons: defaultHeroButtons.map((btn) => ({ ...btn })),
        stats: defaultHeroStats.map((stat) => ({ ...stat })),
      });
    }

    return res.status(200).json({ hero });
  } catch (error) {
    console.error("getHeroSection error:", error);
    return res.status(500).json({
      message: "Failed to fetch hero section",
      error: error.message,
    });
  }
};

export const createHeroSection = async (req, res) => {
  try {
    const existing = await HeroSection.findOne();
    if (existing) {
      return res.status(400).json({
        message: "Hero section already exists. Use update instead.",
        hero: existing,
      });
    }

    const buttons =
      sanitizeButtons(req.body.buttons, { allowEmpty: true }) ||
      defaultHeroButtons.map((btn) => ({ ...btn }));
    const stats =
      sanitizeStats(req.body.stats, { allowEmpty: true }) ||
      defaultHeroStats.map((stat) => ({ ...stat }));
    const animatedWords =
      sanitizeStringArray(req.body.animatedWords, { allowEmpty: true }) ||
      defaultHeroWords.map((word) => word);
    let images =
      sanitizeImages(req.body.images, { allowEmpty: true }) ||
      defaultHeroImages.map((img) => ({ ...img }));

    const uploadedImages = await uploadImagesIfAny(req.files || [], images.length, req.body);
    if (uploadedImages.length) {
      images = [...images, ...uploadedImages];
    }

    const hero = await HeroSection.create({
      badgeText: req.body.badgeText?.trim() || undefined,
      title: req.body.title?.trim() || undefined,
      highlightPrefix: req.body.highlightPrefix?.trim() || undefined,
      highlightNumber: numberOrUndefined(req.body.highlightNumber),
      highlightSuffix: req.body.highlightSuffix?.trim() || undefined,
      description: req.body.description?.trim() || undefined,
      scrollText: req.body.scrollText?.trim() || undefined,
      showScrollIndicator: booleanOrUndefined(req.body.showScrollIndicator),
      animatedWords,
      buttons,
      stats,
      images,
    });

    return res.status(201).json({ message: "Hero section created", hero });
  } catch (error) {
    console.error("createHeroSection error:", error);
    return res.status(500).json({
      message: "Failed to create hero section",
      error: error.message,
    });
  }
};

export const updateHeroSection = async (req, res) => {
  try {
    const { id } = req.params;
    const hero = await HeroSection.findById(id);

    if (!hero) {
      return res.status(404).json({ message: "Hero section not found" });
    }

    const buttons = sanitizeButtons(req.body.buttons, { allowEmpty: true });
    const stats = sanitizeStats(req.body.stats, { allowEmpty: true });
    const animatedWords = sanitizeStringArray(req.body.animatedWords, { allowEmpty: true });
    let images = sanitizeImages(req.body.images, { allowEmpty: true });

    if (buttons !== undefined) hero.buttons = buttons;
    if (stats !== undefined) hero.stats = stats;
    if (animatedWords !== undefined) hero.animatedWords = animatedWords;
    if (images !== undefined) hero.images = images;

    if (req.body.badgeText?.trim()) hero.badgeText = req.body.badgeText.trim();
    if (req.body.title?.trim()) hero.title = req.body.title.trim();
    if (req.body.highlightPrefix?.trim()) hero.highlightPrefix = req.body.highlightPrefix.trim();
    if (req.body.highlightSuffix?.trim()) hero.highlightSuffix = req.body.highlightSuffix.trim();
    if (req.body.description?.trim()) hero.description = req.body.description.trim();
    if (req.body.scrollText?.trim()) hero.scrollText = req.body.scrollText.trim();

    const highlightNumber = numberOrUndefined(req.body.highlightNumber);
    if (highlightNumber !== undefined) hero.highlightNumber = highlightNumber;

    const showScrollIndicator = booleanOrUndefined(req.body.showScrollIndicator);
    if (showScrollIndicator !== undefined) hero.showScrollIndicator = showScrollIndicator;

    const uploadedImages = await uploadImagesIfAny(
      req.files || [],
      hero.images?.length || 0,
      req.body,
    );
    if (uploadedImages.length) {
      hero.images = [...(hero.images || []), ...uploadedImages];
    }

    await hero.save();

    return res.status(200).json({ message: "Hero section updated", hero });
  } catch (error) {
    console.error("updateHeroSection error:", error);
    return res.status(500).json({
      message: "Failed to update hero section",
      error: error.message,
    });
  }
};

export const deleteHeroSection = async (req, res) => {
  try {
    const { id } = req.params;
    const hero = await HeroSection.findByIdAndDelete(id);
    if (!hero) {
      return res.status(404).json({ message: "Hero section not found" });
    }
    return res.status(200).json({ message: "Hero section deleted" });
  } catch (error) {
    console.error("deleteHeroSection error:", error);
    return res.status(500).json({
      message: "Failed to delete hero section",
      error: error.message,
    });
  }
};
