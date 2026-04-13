import CareerSection, {
  defaultCareerBenefits,
  defaultCareerHiringSteps,
  defaultCareerHighlights,
  defaultCareerOpenings,
} from "../models/careerSectionModel.js";

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

const numberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const sanitizeStringList = (value, fallback = []) => {
  const parsed = parseJsonField(value);
  const source = parsed === undefined ? fallback : parsed;
  if (!Array.isArray(source)) return undefined;

  const seen = new Set();
  return source
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const sanitizeHighlightCards = (value, fallback = []) => {
  const parsed = parseJsonField(value);
  const source = parsed === undefined ? fallback : parsed;
  if (!Array.isArray(source)) return undefined;

  return source
    .map((item) => {
      if (!item) return null;
      const title = item.title?.trim();
      const description = item.description?.trim();
      if (!title || !description) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        title,
        description,
        icon: item.icon?.trim() || "BriefcaseBusiness",
        accent: item.accent?.trim() || "brand-blue",
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);
};

const sanitizeOpenings = (value, fallback = []) => {
  const parsed = parseJsonField(value);
  const source = parsed === undefined ? fallback : parsed;
  if (!Array.isArray(source)) return undefined;

  return source
    .map((item) => {
      if (!item) return null;
      const title = item.title?.trim();
      const type = item.type?.trim();
      const location = item.location?.trim();
      const summary = item.summary?.trim();
      if (!title || !type || !location || !summary) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        title,
        type,
        location,
        summary,
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);
};

const trimIfString = (value) => (typeof value === "string" ? value.trim() : undefined);

export const getCareerSection = async (_req, res) => {
  try {
    let section = await CareerSection.findOne().sort({ updatedAt: -1 });

    if (!section) {
      section = await CareerSection.create({
        highlightCards: defaultCareerHighlights.map((item) => ({ ...item })),
        openings: defaultCareerOpenings.map((item) => ({ ...item })),
        benefits: [...defaultCareerBenefits],
        hiringSteps: [...defaultCareerHiringSteps],
      });
    }

    return res.status(200).json({ section });
  } catch (error) {
    console.error("getCareerSection error:", error);
    return res.status(500).json({
      message: "Failed to fetch career section",
      error: error.message,
    });
  }
};

export const createCareerSection = async (req, res) => {
  try {
    const existing = await CareerSection.findOne();
    if (existing) {
      return res.status(400).json({
        message: "Career section already exists. Use update instead.",
        section: existing,
      });
    }

    const section = await CareerSection.create({
      heroBadge: trimIfString(req.body.heroBadge),
      heroTitle: trimIfString(req.body.heroTitle),
      heroHighlight: trimIfString(req.body.heroHighlight),
      heroDescription: trimIfString(req.body.heroDescription),
      applyButtonLabel: trimIfString(req.body.applyButtonLabel),
      rolesButtonLabel: trimIfString(req.body.rolesButtonLabel),
      roleSectionBadge: trimIfString(req.body.roleSectionBadge),
      roleSectionTitle: trimIfString(req.body.roleSectionTitle),
      roleSectionDescription: trimIfString(req.body.roleSectionDescription),
      highlightCards:
        sanitizeHighlightCards(req.body.highlightCards, defaultCareerHighlights) ||
        defaultCareerHighlights.map((item) => ({ ...item })),
      openings:
        sanitizeOpenings(req.body.openings, defaultCareerOpenings) ||
        defaultCareerOpenings.map((item) => ({ ...item })),
      benefitsTitle: trimIfString(req.body.benefitsTitle),
      benefits: sanitizeStringList(req.body.benefits, defaultCareerBenefits) || [...defaultCareerBenefits],
      hiringStepsTitle: trimIfString(req.body.hiringStepsTitle),
      hiringSteps:
        sanitizeStringList(req.body.hiringSteps, defaultCareerHiringSteps) || [...defaultCareerHiringSteps],
      ctaEyebrow: trimIfString(req.body.ctaEyebrow),
      ctaTitle: trimIfString(req.body.ctaTitle),
      ctaDescription: trimIfString(req.body.ctaDescription),
      ctaEmailLabel: trimIfString(req.body.ctaEmailLabel),
      ctaEmailAddress: trimIfString(req.body.ctaEmailAddress),
      ctaEmailSubject: trimIfString(req.body.ctaEmailSubject),
      ctaEmailBody: trimIfString(req.body.ctaEmailBody),
      ctaPhoneLabel: trimIfString(req.body.ctaPhoneLabel),
      ctaPhoneNumber: trimIfString(req.body.ctaPhoneNumber),
      modalTitle: trimIfString(req.body.modalTitle),
      modalDescription: trimIfString(req.body.modalDescription),
      resumeHelperText: trimIfString(req.body.resumeHelperText),
      submitButtonLabel: trimIfString(req.body.submitButtonLabel),
      cancelButtonLabel: trimIfString(req.body.cancelButtonLabel),
    });

    return res.status(201).json({ message: "Career section created", section });
  } catch (error) {
    console.error("createCareerSection error:", error);
    return res.status(500).json({
      message: "Failed to create career section",
      error: error.message,
    });
  }
};

export const updateCareerSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await CareerSection.findById(id);

    if (!section) {
      return res.status(404).json({ message: "Career section not found" });
    }

    const fieldNames = [
      "heroBadge",
      "heroTitle",
      "heroHighlight",
      "heroDescription",
      "applyButtonLabel",
      "rolesButtonLabel",
      "roleSectionBadge",
      "roleSectionTitle",
      "roleSectionDescription",
      "benefitsTitle",
      "hiringStepsTitle",
      "ctaEyebrow",
      "ctaTitle",
      "ctaDescription",
      "ctaEmailLabel",
      "ctaEmailAddress",
      "ctaEmailSubject",
      "ctaEmailBody",
      "ctaPhoneLabel",
      "ctaPhoneNumber",
      "modalTitle",
      "modalDescription",
      "resumeHelperText",
      "submitButtonLabel",
      "cancelButtonLabel",
    ];

    fieldNames.forEach((fieldName) => {
      const nextValue = trimIfString(req.body[fieldName]);
      if (nextValue !== undefined) {
        section[fieldName] = nextValue;
      }
    });

    const highlightCards = sanitizeHighlightCards(req.body.highlightCards);
    if (highlightCards !== undefined) section.highlightCards = highlightCards;

    const openings = sanitizeOpenings(req.body.openings);
    if (openings !== undefined) section.openings = openings;

    const benefits = sanitizeStringList(req.body.benefits);
    if (benefits !== undefined) section.benefits = benefits;

    const hiringSteps = sanitizeStringList(req.body.hiringSteps);
    if (hiringSteps !== undefined) section.hiringSteps = hiringSteps;

    await section.save();

    return res.status(200).json({ message: "Career section updated", section });
  } catch (error) {
    console.error("updateCareerSection error:", error);
    return res.status(500).json({
      message: "Failed to update career section",
      error: error.message,
    });
  }
};

export const deleteCareerSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await CareerSection.findByIdAndDelete(id);
    if (!section) {
      return res.status(404).json({ message: "Career section not found" });
    }

    return res.status(200).json({ message: "Career section deleted" });
  } catch (error) {
    console.error("deleteCareerSection error:", error);
    return res.status(500).json({
      message: "Failed to delete career section",
      error: error.message,
    });
  }
};
