import Footer from "../models/footerModel.js";
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

const numberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const normalizeLinks = (value) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;
  const cleaned = parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = item.label?.trim?.();
      const href = item.href?.trim?.();
      if (!label || !href) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        label,
        href,
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);
  return cleaned;
};

const normalizeSections = (value) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;
  const cleaned = parsed
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const title = section.title?.trim?.();
      if (!title) return null;
      const links = normalizeLinks(section.links) || [];
      const order = numberOrUndefined(section.order);
      return {
        ...(section._id ? { _id: section._id } : {}),
        title,
        ...(order !== undefined ? { order } : {}),
        links,
      };
    })
    .filter(Boolean);
  return cleaned;
};

const normalizeSocials = (value) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;
  const cleaned = parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = item.label?.trim?.();
      const href = item.href?.trim?.();
      const icon = item.icon?.trim?.();
      if (!label || !href || !icon) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        label,
        href,
        icon,
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);
  return cleaned;
};

const assignIfProvided = (target, source, keys) => {
  keys.forEach((k) => {
    if (source[k]?.trim?.()) target[k] = source[k].trim();
  });
};

const uploadLogoIfPresent = async (file) => {
  if (!file) return null;
  const [upload] = await cloudinaryUpload([file]);
  return upload.secure_url;
};

export const getFooter = async (_req, res) => {
  try {
    let footer = await Footer.findOne().sort({ updatedAt: -1 });
    if (!footer) {
      footer = await Footer.create({});
    }
    return res.status(200).json({ footer });
  } catch (error) {
    console.error("getFooter error:", error);
    return res.status(500).json({ message: "Failed to fetch footer", error: error.message });
  }
};

export const createFooter = async (req, res) => {
  try {
    const existing = await Footer.findOne();
    if (existing) {
      return res.status(400).json({ message: "Footer already exists. Use update instead.", footer: existing });
    }

    const uploadedLogo = await uploadLogoIfPresent(req.file);
    const contact = parseJsonField(req.body.contact);

    const footer = await Footer.create({
      logo: uploadedLogo || req.body.logo?.trim() || undefined,
      description: req.body.description?.trim() || undefined,
      ctaTitle: req.body.ctaTitle?.trim() || undefined,
      ctaSubtitle: req.body.ctaSubtitle?.trim() || undefined,
      ctaButtonLabel: req.body.ctaButtonLabel?.trim() || undefined,
      ctaButtonHref: req.body.ctaButtonHref?.trim() || undefined,
      sections: normalizeSections(req.body.sections),
      socials: normalizeSocials(req.body.socials),
      contact: contact || {
        phone: req.body.phone?.trim() || undefined,
        email: req.body.email?.trim() || undefined,
        address: req.body.address?.trim() || undefined,
        mapLink: req.body.mapLink?.trim() || undefined,
      },
      bottomLinks: normalizeLinks(req.body.bottomLinks),
    });

    return res.status(201).json({ message: "Footer created", footer });
  } catch (error) {
    console.error("createFooter error:", error);
    return res.status(500).json({ message: "Failed to create footer", error: error.message });
  }
};

export const updateFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const footer = await Footer.findById(id);
    if (!footer) return res.status(404).json({ message: "Footer not found" });
    const uploadedLogo = await uploadLogoIfPresent(req.file);
    const contact = parseJsonField(req.body.contact);

    assignIfProvided(footer, req.body, [
      "logo",
      "description",
      "ctaTitle",
      "ctaSubtitle",
      "ctaButtonLabel",
      "ctaButtonHref",
    ]);

    if (uploadedLogo) footer.logo = uploadedLogo;

    const sections = normalizeSections(req.body.sections);
    if (sections !== undefined) footer.sections = sections;

    const socials = normalizeSocials(req.body.socials);
    if (socials !== undefined) footer.socials = socials;

    const bottomLinks = normalizeLinks(req.body.bottomLinks);
    if (bottomLinks !== undefined) footer.bottomLinks = bottomLinks;

    if (contact) {
      footer.contact = {
        phone: contact.phone?.trim?.() || footer.contact.phone,
        email: contact.email?.trim?.() || footer.contact.email,
        address: contact.address?.trim?.() || footer.contact.address,
        mapLink: contact.mapLink?.trim?.() || footer.contact.mapLink,
      };
    } else if (req.body.phone?.trim() || req.body.email?.trim() || req.body.address?.trim() || req.body.mapLink?.trim()) {
      footer.contact = {
        phone: req.body.phone?.trim() || footer.contact.phone,
        email: req.body.email?.trim() || footer.contact.email,
        address: req.body.address?.trim() || footer.contact.address,
        mapLink: req.body.mapLink?.trim() || footer.contact.mapLink,
      };
    }

    await footer.save();
    return res.status(200).json({ message: "Footer updated", footer });
  } catch (error) {
    console.error("updateFooter error:", error);
    return res.status(500).json({ message: "Failed to update footer", error: error.message });
  }
};

export const deleteFooter = async (req, res) => {
  try {
    const { id } = req.params;
    const footer = await Footer.findByIdAndDelete(id);
    if (!footer) return res.status(404).json({ message: "Footer not found" });
    return res.status(200).json({ message: "Footer deleted" });
  } catch (error) {
    console.error("deleteFooter error:", error);
    return res.status(500).json({ message: "Failed to delete footer", error: error.message });
  }
};
