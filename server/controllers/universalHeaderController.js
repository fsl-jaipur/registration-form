import UniversalHeader, {
  defaultButtons,
  defaultNavItems,
} from "../models/universalHeaderModel.js";
import { cloudinaryUpload } from "../middlewares/cloudinaryUpload.js";

const parseJsonField = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
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

const sanitizeNavItems = (value, { allowEmpty = false } = {}) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;

  const cleaned = parsed
    .map((item) => {
      if (!item) return null;
      const label = item.label?.trim();
      const href = item.href?.trim();
      if (!label || !href) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        label,
        href,
        ...(order !== undefined ? { order } : {}),
        isExternal: Boolean(item.isExternal),
      };
    })
    .filter(Boolean);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};

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
        style: ["primary", "secondary", "outline"].includes(style)
          ? style
          : "primary",
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};

const uploadLogoIfPresent = async (file) => {
  if (!file) return null;
  const [uploadResult] = await cloudinaryUpload([file]);
  return uploadResult.secure_url;
};

export const getUniversalHeader = async (_req, res) => {
  try {
    let header = await UniversalHeader.findOne().sort({ updatedAt: -1 });

    if (!header) {
      header = await UniversalHeader.create({
        navItems: defaultNavItems.map((item) => ({ ...item })),
        buttons: defaultButtons.map((item) => ({ ...item })),
      });
    }

    return res.status(200).json({ header });
  } catch (error) {
    console.error("getUniversalHeader error:", error);
    return res.status(500).json({
      message: "Failed to fetch universal header",
      error: error.message,
    });
  }
};

export const createUniversalHeader = async (req, res) => {
  try {
    const existing = await UniversalHeader.findOne();
    if (existing) {
      return res.status(400).json({
        message: "Universal header already exists. Use update instead.",
        header: existing,
      });
    }

    const navItems =
      sanitizeNavItems(req.body.navItems, { allowEmpty: true }) ||
      defaultNavItems.map((item) => ({ ...item }));
    const buttons =
      sanitizeButtons(req.body.buttons, { allowEmpty: true }) ||
      defaultButtons.map((item) => ({ ...item }));
    const uploadedLogo = await uploadLogoIfPresent(req.file);
    const logo = uploadedLogo || req.body.logo?.trim() || "/images/logo.png";
    const logoAlt = req.body.logoAlt?.trim() || "FullStack Learning";

    const header = await UniversalHeader.create({
      logo,
      logoAlt,
      navItems,
      buttons,
    });

    return res.status(201).json({ message: "Universal header created", header });
  } catch (error) {
    console.error("createUniversalHeader error:", error);
    return res.status(500).json({
      message: "Failed to create universal header",
      error: error.message,
    });
  }
};

export const updateUniversalHeader = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};

    const uploadedLogo = await uploadLogoIfPresent(req.file);
    const bodyLogo = req.body.logo?.trim();
    if (uploadedLogo) update.logo = uploadedLogo;
    else if (bodyLogo) update.logo = bodyLogo;

    if (req.body.logoAlt?.trim()) update.logoAlt = req.body.logoAlt.trim();

    const navItems = sanitizeNavItems(req.body.navItems, { allowEmpty: true });
    if (navItems !== undefined) update.navItems = navItems;

    const buttons = sanitizeButtons(req.body.buttons, { allowEmpty: true });
    if (buttons !== undefined) update.buttons = buttons;

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "No changes provided" });
    }

    const header = await UniversalHeader.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!header) {
      return res.status(404).json({ message: "Universal header not found" });
    }

    return res.status(200).json({ message: "Universal header updated", header });
  } catch (error) {
    console.error("updateUniversalHeader error:", error);
    return res.status(500).json({
      message: "Failed to update universal header",
      error: error.message,
    });
  }
};

export const deleteUniversalHeader = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await UniversalHeader.findByIdAndDelete(id);
    if (!header) {
      return res.status(404).json({ message: "Universal header not found" });
    }
    return res.status(200).json({ message: "Universal header deleted" });
  } catch (error) {
    console.error("deleteUniversalHeader error:", error);
    return res.status(500).json({
      message: "Failed to delete universal header",
      error: error.message,
    });
  }
};

export const addNavItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, href, order, isExternal } = req.body;

    if (!label?.trim() || !href?.trim()) {
      return res.status(400).json({ message: "Label and href are required." });
    }

    const orderValue = numberOrUndefined(order);
    const navItem = {
      label: label.trim(),
      href: href.trim(),
      isExternal: Boolean(isExternal),
      ...(orderValue !== undefined ? { order: orderValue } : {}),
    };

    const header = await UniversalHeader.findByIdAndUpdate(
      id,
      { $push: { navItems: navItem } },
      { new: true },
    );

    if (!header) {
      return res.status(404).json({ message: "Universal header not found" });
    }

    return res.status(201).json({ message: "Navigation item added", header });
  } catch (error) {
    console.error("addNavItem error:", error);
    return res.status(500).json({
      message: "Failed to add navigation item",
      error: error.message,
    });
  }
};

export const updateNavItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { label, href, order, isExternal } = req.body;

    const updateFields = {};
    if (label?.trim()) updateFields["navItems.$.label"] = label.trim();
    if (href?.trim()) updateFields["navItems.$.href"] = href.trim();
    if (order !== undefined) {
      const numericOrder = Number(order);
      if (Number.isFinite(numericOrder)) {
        updateFields["navItems.$.order"] = numericOrder;
      }
    }
    if (isExternal !== undefined) {
      updateFields["navItems.$.isExternal"] = Boolean(isExternal);
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({ message: "No changes provided" });
    }

    const header = await UniversalHeader.findOneAndUpdate(
      { _id: id, "navItems._id": itemId },
      { $set: updateFields },
      { new: true },
    );

    if (!header) {
      return res.status(404).json({ message: "Navigation item not found" });
    }

    return res.status(200).json({ message: "Navigation item updated", header });
  } catch (error) {
    console.error("updateNavItem error:", error);
    return res.status(500).json({
      message: "Failed to update navigation item",
      error: error.message,
    });
  }
};

export const deleteNavItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const header = await UniversalHeader.findByIdAndUpdate(
      id,
      { $pull: { navItems: { _id: itemId } } },
      { new: true },
    );

    if (!header) {
      return res.status(404).json({ message: "Universal header not found" });
    }

    return res.status(200).json({ message: "Navigation item deleted", header });
  } catch (error) {
    console.error("deleteNavItem error:", error);
    return res.status(500).json({
      message: "Failed to delete navigation item",
      error: error.message,
    });
  }
};

export const addButton = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, href, style, order } = req.body;

    if (!label?.trim() || !href?.trim()) {
      return res.status(400).json({ message: "Label and href are required." });
    }

    const orderValue = numberOrUndefined(order);
    const button = {
      label: label.trim(),
      href: href.trim(),
      style: ["primary", "secondary", "outline"].includes(style)
        ? style
        : "primary",
      ...(orderValue !== undefined ? { order: orderValue } : {}),
    };

    const header = await UniversalHeader.findByIdAndUpdate(
      id,
      { $push: { buttons: button } },
      { new: true },
    );

    if (!header) {
      return res.status(404).json({ message: "Universal header not found" });
    }

    return res.status(201).json({ message: "Button added", header });
  } catch (error) {
    console.error("addButton error:", error);
    return res.status(500).json({
      message: "Failed to add button",
      error: error.message,
    });
  }
};

export const updateButton = async (req, res) => {
  try {
    const { id, buttonId } = req.params;
    const { label, href, style, order } = req.body;

    const updateFields = {};
    if (label?.trim()) updateFields["buttons.$.label"] = label.trim();
    if (href?.trim()) updateFields["buttons.$.href"] = href.trim();
    if (style) {
      updateFields["buttons.$.style"] = ["primary", "secondary", "outline"].includes(style)
        ? style
        : "primary";
    }
    if (order !== undefined) {
      const numericOrder = Number(order);
      if (Number.isFinite(numericOrder)) {
        updateFields["buttons.$.order"] = numericOrder;
      }
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({ message: "No changes provided" });
    }

    const header = await UniversalHeader.findOneAndUpdate(
      { _id: id, "buttons._id": buttonId },
      { $set: updateFields },
      { new: true },
    );

    if (!header) {
      return res.status(404).json({ message: "Button not found" });
    }

    return res.status(200).json({ message: "Button updated", header });
  } catch (error) {
    console.error("updateButton error:", error);
    return res.status(500).json({
      message: "Failed to update button",
      error: error.message,
    });
  }
};

export const deleteButton = async (req, res) => {
  try {
    const { id, buttonId } = req.params;
    const header = await UniversalHeader.findByIdAndUpdate(
      id,
      { $pull: { buttons: { _id: buttonId } } },
      { new: true },
    );

    if (!header) {
      return res.status(404).json({ message: "Universal header not found" });
    }

    return res.status(200).json({ message: "Button deleted", header });
  } catch (error) {
    console.error("deleteButton error:", error);
    return res.status(500).json({
      message: "Failed to delete button",
      error: error.message,
    });
  }
};
