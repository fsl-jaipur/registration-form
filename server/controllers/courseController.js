import Course from "../models/courseModel.js";
import { defaultCourses } from "../services/courseDefaults.js";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const buildPayload = (body = {}) => {
  const payload = {
    title: body.title,
    description: body.description ?? "",
    overview: body.overview ?? "",
    duration: body.duration ?? "",
    students: body.students ?? "",
    rating:
      body.rating === undefined || body.rating === null || body.rating === ""
        ? undefined
        : Number(body.rating),
    level: body.level ?? "",
    badge: body.badge ?? null,
    badgeColor: body.badgeColor ?? "",
    color: body.color ?? "",
    iconName: body.iconName ?? "",
    fee: body.fee ?? "",
    tags: normalizeList(body.tags),
    syllabus: normalizeList(body.syllabus ?? body.modules),
    order:
      body.order === undefined || body.order === null || body.order === ""
        ? undefined
        : Number(body.order),
    slug: body.slug ? slugify(body.slug) : undefined,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || Number.isNaN(payload[key])) {
      delete payload[key];
    }
  });

  if (payload.iconName) {
    payload.iconName = payload.iconName.trim();
  }

  return payload;
};

const seedCoursesIfEmpty = async () => {
  const count = await Course.estimatedDocumentCount();
  if (count === 0) {
    const seeded = defaultCourses.map((course) => ({
      ...course,
      slug: slugify(course.slug || course.title),
    }));
    await Course.insertMany(seeded);
  }
};

export const getCourses = async (_req, res) => {
  try {
    await seedCoursesIfEmpty();
    const courses = await Course.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json({ courses });
  } catch (error) {
    console.error("Error fetching courses", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

export const getCourseBySlug = async (req, res) => {
  try {
    await seedCoursesIfEmpty();
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ course });
  } catch (error) {
    console.error("Error fetching course", error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ course });
  } catch (error) {
    console.error("Error fetching course by id", error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

export const createCourse = async (req, res) => {
  try {
    const payload = buildPayload(req.body);

    if (!payload.title) {
      return res.status(400).json({ message: "Title is required" });
    }

    payload.slug = slugify(payload.slug || payload.title);

    const slugExists = await Course.findOne({ slug: payload.slug });
    if (slugExists) {
      return res.status(409).json({ message: "A course with this slug already exists" });
    }

    const course = await Course.create(payload);
    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error("Error creating course", error);
    res.status(500).json({ message: "Failed to create course" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = buildPayload(req.body);

    if (payload.title && !payload.slug) {
      payload.slug = slugify(payload.title);
    }

    const course = await Course.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course updated", course });
  } catch (error) {
    console.error("Error updating course", error);
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Slug already exists" });
    }
    res.status(500).json({ message: "Failed to update course" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    console.error("Error deleting course", error);
    res.status(500).json({ message: "Failed to delete course" });
  }
};
