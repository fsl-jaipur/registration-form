import { Course, slugify } from "@/lib/courses";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";

const normalizeCourse = (course: any = {}): Course => ({
  ...course,
  slug: course.slug || (course.title ? slugify(course.title) : undefined),
  tags: Array.isArray(course.tags)
    ? course.tags
    : typeof course.tags === "string"
      ? course.tags.split(/[,\\n]/).map((t: string) => t.trim()).filter(Boolean)
      : [],
  syllabus: Array.isArray(course.syllabus)
    ? course.syllabus
    : typeof course.syllabus === "string"
      ? course.syllabus.split(/[,\\n]/).map((t: string) => t.trim()).filter(Boolean)
      : [],
  rating: course.rating ? Number(course.rating) : course.rating,
});

export const fetchCourses = async (): Promise<Course[]> => {
  if (!API_BASE) {
    throw new Error("API base URL is not configured");
  }

  const res = await fetch(`${API_BASE}/courses`);
  if (!res.ok) {
    throw new Error("Failed to fetch courses");
  }

  const json = await res.json();
  return (json?.courses || []).map(normalizeCourse);
};

export const fetchCourseBySlug = async (slug: string): Promise<Course | null> => {
  if (!API_BASE) {
    throw new Error("API base URL is not configured");
  }

  const res = await fetch(`${API_BASE}/courses/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Failed to fetch course");
  }

  const json = await res.json();
  return json?.course ? normalizeCourse(json.course) : null;
};

const resolveCourseId = async (course: Pick<Course, "_id" | "slug" | "title">) => {
  if (course._id) return course._id;

  const slug = course.slug || (course.title ? slugify(course.title) : "");
  if (!slug) {
    throw new Error("Course id is missing");
  }

  const existing = await fetchCourseBySlug(slug);
  if (!existing?._id) {
    throw new Error("Course not found");
  }

  return existing._id;
};

export const saveCourse = async (course: Partial<Course>): Promise<Course> => {
  if (!API_BASE) {
    throw new Error("API base URL is not configured");
  }

  if (!course.title) {
    throw new Error("Title is required");
  }

  const slug = course.slug || slugify(course.title);
  const payload = {
    ...course,
    slug,
    tags: course.tags ?? [],
    syllabus: course.syllabus ?? [],
  };

  let isUpdate = Boolean(course._id);
  let targetId = course._id;

  // If we don't have an _id (e.g., fallback data), try to resolve by slug to avoid duplicate slug errors.
  if (!isUpdate) {
    const existing = await fetchCourseBySlug(slug);
    if (existing?._id) {
      isUpdate = true;
      targetId = existing._id;
    }
  }

  const url = isUpdate && targetId ? `${API_BASE}/courses/${targetId}` : `${API_BASE}/courses`;

  const res = await fetch(url, {
    method: isUpdate ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = await res.text();
    try {
      const json = JSON.parse(message);
      message = json?.message || message;
    } catch {
      /* keep raw text */
    }
    throw new Error(message || "Failed to save course");
  }

  const json = await res.json();
  return normalizeCourse(json?.course ?? payload);
};

export const deleteCourse = async (course: Pick<Course, "_id" | "slug" | "title">) => {
  if (!API_BASE) {
    throw new Error("API base URL is not configured");
  }

  const courseId = await resolveCourseId(course);
  const res = await fetch(`${API_BASE}/courses/${courseId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    let message = await res.text();
    try {
      const json = JSON.parse(message);
      message = json?.message || message;
    } catch {
      /* keep raw text */
    }
    throw new Error(message || "Failed to delete course");
  }
};
