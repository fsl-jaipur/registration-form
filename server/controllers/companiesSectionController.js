import CompaniesSection, {
  defaultCompanies,
} from "../models/companiesSectionModel.js";

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

const sanitizeCompanies = (value, { allowEmpty = false } = {}) => {
  const parsed = parseJsonField(value);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed)) return undefined;

  const cleaned = parsed
    .map((item) => {
      if (!item) return null;
      const name = item.name?.trim();
      if (!name) return null;
      const order = numberOrUndefined(item.order);
      return {
        ...(item._id ? { _id: item._id } : {}),
        name,
        logo: item.logo?.trim() || "",
        ...(order !== undefined ? { order } : {}),
      };
    })
    .filter(Boolean);

  if (!cleaned.length && !allowEmpty) return undefined;
  return cleaned;
};

export const getCompaniesSection = async (_req, res) => {
  try {
    let section = await CompaniesSection.findOne().sort({ updatedAt: -1 });

    if (!section) {
      section = await CompaniesSection.create({
        companies: defaultCompanies.map((name, order) => ({ name, order })),
      });
    }

    return res.status(200).json({ section });
  } catch (error) {
    console.error("getCompaniesSection error:", error);
    return res.status(500).json({
      message: "Failed to fetch companies section",
      error: error.message,
    });
  }
};

export const createCompaniesSection = async (req, res) => {
  try {
    const existing = await CompaniesSection.findOne();
    if (existing) {
      return res.status(400).json({
        message: "Companies section already exists. Use update instead.",
        section: existing,
      });
    }

    const companies =
      sanitizeCompanies(req.body.companies, { allowEmpty: true }) ||
      defaultCompanies.map((name, order) => ({ name, order }));

    const section = await CompaniesSection.create({
      badgeText: req.body.badgeText?.trim() || undefined,
      heading: req.body.heading?.trim() || undefined,
      description: req.body.description?.trim() || undefined,
      companies,
    });

    return res.status(201).json({ message: "Companies section created", section });
  } catch (error) {
    console.error("createCompaniesSection error:", error);
    return res.status(500).json({
      message: "Failed to create companies section",
      error: error.message,
    });
  }
};

export const updateCompaniesSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await CompaniesSection.findById(id);

    if (!section) {
      return res.status(404).json({ message: "Companies section not found" });
    }

    const companies = sanitizeCompanies(req.body.companies, { allowEmpty: true });
    if (companies !== undefined) section.companies = companies;

    if (req.body.badgeText?.trim()) section.badgeText = req.body.badgeText.trim();
    if (req.body.heading?.trim()) section.heading = req.body.heading.trim();
    if (req.body.description?.trim()) section.description = req.body.description.trim();

    await section.save();

    return res.status(200).json({ message: "Companies section updated", section });
  } catch (error) {
    console.error("updateCompaniesSection error:", error);
    return res.status(500).json({
      message: "Failed to update companies section",
      error: error.message,
    });
  }
};

export const deleteCompaniesSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await CompaniesSection.findByIdAndDelete(id);
    if (!section) {
      return res.status(404).json({ message: "Companies section not found" });
    }
    return res.status(200).json({ message: "Companies section deleted" });
  } catch (error) {
    console.error("deleteCompaniesSection error:", error);
    return res.status(500).json({
      message: "Failed to delete companies section",
      error: error.message,
    });
  }
};

export const addCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, order } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Company name is required." });
    }

    const orderValue = numberOrUndefined(order);
    const company = {
      name: name.trim(),
      logo: logo?.trim() || "",
      ...(orderValue !== undefined ? { order: orderValue } : {}),
    };

    const section = await CompaniesSection.findByIdAndUpdate(
      id,
      { $push: { companies: company } },
      { new: true },
    );

    if (!section) {
      return res.status(404).json({ message: "Companies section not found" });
    }

    return res.status(201).json({ message: "Company added", section });
  } catch (error) {
    console.error("addCompany error:", error);
    return res.status(500).json({
      message: "Failed to add company",
      error: error.message,
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const updateFields = {};
    if (req.body.name?.trim()) updateFields["companies.$.name"] = req.body.name.trim();
    if (req.body.logo !== undefined) updateFields["companies.$.logo"] = req.body.logo?.trim() || "";
    if (req.body.order !== undefined) {
      const numericOrder = Number(req.body.order);
      if (Number.isFinite(numericOrder)) updateFields["companies.$.order"] = numericOrder;
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({ message: "No changes provided" });
    }

    const section = await CompaniesSection.findOneAndUpdate(
      { _id: id, "companies._id": companyId },
      { $set: updateFields },
      { new: true },
    );

    if (!section) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(200).json({ message: "Company updated", section });
  } catch (error) {
    console.error("updateCompany error:", error);
    return res.status(500).json({
      message: "Failed to update company",
      error: error.message,
    });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id, companyId } = req.params;
    const section = await CompaniesSection.findByIdAndUpdate(
      id,
      { $pull: { companies: { _id: companyId } } },
      { new: true },
    );

    if (!section) {
      return res.status(404).json({ message: "Companies section not found" });
    }

    return res.status(200).json({ message: "Company deleted", section });
  } catch (error) {
    console.error("deleteCompany error:", error);
    return res.status(500).json({
      message: "Failed to delete company",
      error: error.message,
    });
  }
};
